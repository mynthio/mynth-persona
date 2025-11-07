import { db } from "@/db/drizzle";
import { chats, media, mediaGenerations, messages } from "@/db/schema";
import { metadata, task } from "@trigger.dev/sdk";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import logsnag from "@/lib/logsnag";
import { ImageModelId } from "@/config/shared/image-models";
import { ImageGenerationFactory } from "@/lib/generation/image-generation/image-generation-factory";
import { processImage } from "@/lib/image-processing/image-processor";
import { uploadToBunny } from "@/lib/upload";
import {
  craftImagePromptForMessageCharacterMode,
  craftImagePromptForMessageCreativeMode,
} from "./utils/generate-message-image-prompt";
import { ImageGenerationMode } from "@/actions/generate-message-image";
import { logger } from "@/lib/logger";

import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import {
  getImageRateLimiterForPlan,
  imageRateLimitRestore,
} from "@/lib/rate-limit-image";
import { PlanId } from "@/config/shared/plans";
import { decrementConcurrentImageJob } from "@/lib/concurrent-image-jobs";

// Zod schema for input validation
const GenerateMessageImageTaskPayloadSchema = z.object({
  messageId: z.string(),
  chatId: z.string(),
  userId: z.string(),
  modelId: z.string(),
  mode: z.enum(["character", "creative"]).default("character"),
  cost: z.number(),
  planId: z.string(),
});

type GenerateMessageImageTaskPayload = z.infer<
  typeof GenerateMessageImageTaskPayloadSchema
> & {
  modelId: ImageModelId;
  mode: ImageGenerationMode;
  planId: PlanId;
};

export const generateMessageImageTask = task({
  id: "generate-message-image",
  maxDuration: 300,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: GenerateMessageImageTaskPayload, { ctx }) => {
    /**
     * Validate input data with Zod schema
     */
    const validationResult =
      GenerateMessageImageTaskPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      throw new Error(`Invalid payload: ${validationResult.error.message}`);
    }

    /**
     * Get data from payload
     */
    const { userId, messageId, chatId, modelId, mode } = payload;

    // Fetch message
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      throw new Error("Message not found");
    }

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

    // Fetch messages up to target message using the proper recursive query
    const { messages: messagesData } = await getChatMessagesData(chatId, {
      messageId: messageId,
      strict: true,
      limit: 6, // Get up to 6 messages for context
    });

    // Get the appropriate model
    const imageGenerationModel = ImageGenerationFactory.byModelId(modelId);

    let imagePrompt = metadata.get("imagePrompt") as string | undefined;

    if (!imagePrompt) {
      // Use appropriate prompt crafting function based on mode
      const craftPromptFunction =
        mode === "character"
          ? craftImagePromptForMessageCharacterMode
          : craftImagePromptForMessageCreativeMode;

      const imageGenerationResult = await craftPromptFunction({
        messages: messagesData,
        targetMessageId: messageId,
        personaData: persona.data,
        chatSettings: chatSettings,
      });

      if (!imageGenerationResult?.prompt) {
        throw new Error("Failed to generate image prompt");
      }

      imagePrompt = imageGenerationResult.prompt;
      metadata.set("imagePrompt", imagePrompt);
    }

    // Get scene image URL from chat settings if it exists (only for character mode)
    const sceneImageMediaId = chatSettings?.sceneImageMediaId;
    let referenceImages: string[] = [];

    if (mode === "character" && sceneImageMediaId) {
      const sceneImageUrl = `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/media/${sceneImageMediaId}.webp`;
      referenceImages = [sceneImageUrl];
    }

    // Generate image with reference images if available (character mode only)
    let generateImageResult;
    try {
      generateImageResult = await imageGenerationModel.generate(
        imagePrompt,
        referenceImages.length > 0 ? { referenceImages } : undefined
      );
    } catch (error) {
      console.error(error);
      const errorMessage = JSON.stringify(error);

      // Log original error for debugging
      logger.error(
        { error: errorMessage, messageId, chatId },
        "Image generation failed"
      );

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

    // Insert media and mediaGenerations in transaction
    await db.transaction(async (tx) => {
      await tx.insert(mediaGenerations).values({
        id: mediaGenerationId,
        metadata: {
          chatId,
          messageId,
          personaId: chatPersona.personaId,
          prompt: imagePrompt,
          aiModel: imageGenerationModel.modelId,
        },
        settings: {
          modelId,
          mode,
          referenceImages: referenceImages.length > 0 ? referenceImages : null,
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
        nsfw: "sfw", // Chat images default to SFW
        metadata: {
          messageId,
        },
      });

      // Update message metadata with new media atomically to avoid race conditions
      // Uses PostgreSQL's jsonb_set and || operator to append to array without fetching
      await tx
        .update(messages)
        .set({
          metadata: sql`jsonb_set(
            COALESCE(${messages.metadata}, '{}'::jsonb),
            '{media}',
            COALESCE(${
              messages.metadata
            } #> '{media}', '[]'::jsonb) || ${JSON.stringify([
            { id: mediaId, type: "image" },
          ])}::jsonb
          )`,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId));

      // If chat has no scene image, set this as the scene image atomically
      // The WHERE clause ensures only the first job succeeds if multiple run concurrently
      await tx
        .update(chats)
        .set({
          settings: sql`jsonb_set(
            COALESCE(${chats.settings}, '{}'::jsonb),
            '{sceneImageMediaId}',
            ${JSON.stringify(mediaId)}::jsonb
          )`,
        })
        .where(
          and(
            eq(chats.id, chatId),
            sql`${chats.settings} #>> '{sceneImageMediaId}' IS NULL`
          )
        );
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
        channel: "message-image-generation",
        event: "message-image-generation-completed",
        description: "Message image generation completed",
        icon: "🖼️",
        user_id: payload.userId,
      })
      .catch(() => {});
  },
});
