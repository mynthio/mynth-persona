import { db } from "@/db/drizzle";
import { chats, media, mediaGenerations } from "@/db/schema";
import { metadata, task } from "@trigger.dev/sdk";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import logsnag from "@/lib/logsnag";
import { ImageModelId } from "@/config/shared/image-models";
import { ImageGenerationFactory } from "@/lib/generation/image-generation/image-generation-factory";
import { processImage } from "@/lib/image-processing/image-processor";
import { uploadToBunny } from "@/lib/upload";
import { craftImagePromptForSceneImage } from "./utils/generate-scene-image-prompt";
import { logger } from "@/lib/logger";

import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import {
  getImageRateLimiterForPlan,
  imageRateLimitRestore,
} from "@/lib/rate-limit-image";
import { PlanId } from "@/config/shared/plans";
import { decrementConcurrentImageJob } from "@/lib/concurrent-image-jobs";

// Zod schema for input validation
const GenerateChatSceneImageTaskPayloadSchema = z.object({
  chatId: z.string(),
  userId: z.string(),
  modelId: z.string(),
  cost: z.number(),
  planId: z.string(),
});

type GenerateChatSceneImageTaskPayload = z.infer<
  typeof GenerateChatSceneImageTaskPayloadSchema
> & {
  modelId: ImageModelId;
  planId: PlanId;
};

export const generateChatSceneImageTask = task({
  id: "generate-chat-scene-image",
  maxDuration: 300,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: GenerateChatSceneImageTaskPayload, { ctx }) => {
    /**
     * Validate input data with Zod schema
     */
    const validationResult =
      GenerateChatSceneImageTaskPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      throw new Error(`Invalid payload: ${validationResult.error.message}`);
    }

    /**
     * Get data from payload
     */
    const { userId, chatId, modelId } = payload;

    // Fetch chat with personas
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
      with: {
        chatPersonas: {
          with: {
            personaVersion: true,
          },
        },
      },
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.chatPersonas.length === 0) {
      throw new Error("Chat has no associated personas");
    }

    // Get the first persona (assuming single-persona chats for now)
    const chatPersona = chat.chatPersonas[0];
    const chatSettings = chat.settings as ChatSettings | null;
    const persona = chatPersona.personaVersion;

    // Get the appropriate model
    const imageGenerationModel = ImageGenerationFactory.byModelId(modelId);

    let imagePrompt = metadata.get("imagePrompt") as string | undefined;

    if (!imagePrompt) {
      const imageGenerationResult = await craftImagePromptForSceneImage({
        personaData: persona.data,
        chatSettings: chatSettings,
        modelName: imageGenerationModel.displayName,
      });

      if (!imageGenerationResult?.prompt) {
        throw new Error("Failed to generate image prompt");
      }

      imagePrompt = imageGenerationResult.prompt;
      metadata.set("imagePrompt", imagePrompt);
    }

    // Generate image (no reference images for scene)
    let generateImageResult;
    try {
      generateImageResult = await imageGenerationModel.generate(imagePrompt);
    } catch (error) {
      const errorMessage = String(error);

      // Log original error for debugging
      logger.error({ error: errorMessage, chatId }, "Scene image generation failed");

      // Check if it's a content moderation error
      if (
        errorMessage.includes("invalidProviderResponse") &&
        (errorMessage.includes("filtered out because it violated") ||
         errorMessage.includes("usage guidelines"))
      ) {
        throw new Error("CONTENT_MODERATED");
      }

      // Throw generic error for everything else
      throw new Error("UNKNOWN_ERROR");
    }

    /**
     * Process Image
     * - Format to webp using same size
     * - Create thumbnail
     */
    const [processedImage, processedThumbnail] = await processImage(
      generateImageResult.image,
      [
        {},
        {
          resize: {
            width: 240,
            height: 240,
            fit: "cover",
            position: "top",
          },
        },
      ]
    );

    // Upload to Bunny.net storage
    const mediaId = `med_${nanoid(32)}`;
    const mediaGenerationId = `mdg_${nanoid()}`;

    const mainFilePath = `media/${mediaId}.webp`;
    const thumbnailFilePath = `media/${mediaId}_thumb.webp`;

    const uploadMainImage = uploadToBunny(mainFilePath, processedImage);
    const uploadThumbnailImage = uploadToBunny(
      thumbnailFilePath,
      processedThumbnail
    );

    await Promise.all([uploadMainImage, uploadThumbnailImage]);

    const imageUrl = `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/${mainFilePath}`;

    // Insert media and mediaGenerations, and update chat settings in transaction
    await db.transaction(async (tx) => {
      await tx.insert(mediaGenerations).values({
        id: mediaGenerationId,
        metadata: {
          chatId,
          personaId: chatPersona.personaId,
          prompt: imagePrompt,
          aiModel: imageGenerationModel.modelId,
          isSceneImage: true,
        },
        settings: {
          modelId,
        },
        status: "success",
        completedAt: new Date(),
      });

      await tx.insert(media).values({
        id: mediaId,
        personaId: chatPersona.personaId,
        userId,
        chatId,
        generationId: mediaGenerationId,
        type: "image",
        visibility: "private",
        nsfw: "sfw",
        metadata: {
          isSceneImage: true,
        },
      });

      // Set this as the scene image atomically to avoid race conditions
      await tx
        .update(chats)
        .set({
          settings: sql`jsonb_set(
            COALESCE(${chats.settings}, '{}'::jsonb),
            '{sceneImageMediaId}',
            ${JSON.stringify(mediaId)}::jsonb
          )`,
        })
        .where(eq(chats.id, chatId));
    });

    logger.flush();

    return {
      imageUrl,
      mediaId,
    };
  },
  onFailure: async ({ payload, error }) => {
    const mediaGenerationId = metadata.get("mediaGenerationId")?.toString();

    if (mediaGenerationId) {
      await db
        .update(mediaGenerations)
        .set({
          status: "fail",
          metadata: {
            errorCode: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          },
        })
        .where(eq(mediaGenerations.id, mediaGenerationId));
    }

    // Restore rate limit points on failure
    const { userId, cost, planId } = payload;
    const rateLimiter = getImageRateLimiterForPlan(planId);
    await imageRateLimitRestore(rateLimiter, userId, cost);

    // Decrement concurrent job counter
    await decrementConcurrentImageJob(userId);
  },
  onSuccess: async ({ payload }) => {
    // Decrement concurrent job counter
    await decrementConcurrentImageJob(payload.userId);

    await logsnag
      .track({
        channel: "chat-scene-image-generation",
        event: "chat-scene-image-generation-completed",
        description: "Chat scene image generation completed",
        icon: "🖼️",
        user_id: payload.userId,
      })
      .catch(() => {});
  },
});
