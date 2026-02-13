import { db } from "@/db/drizzle";
import { chats, media, mediaGenerations, messages } from "@/db/schema";
import { metadata, task } from "@trigger.dev/sdk";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import logsnag from "@/lib/logsnag";
import { revalidateCacheTag } from "./utils/revalidate-cache";
import { getImagesPerGeneration, ImageModelId } from "@/config/shared/image-models";
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
import { ImageGenerationResult } from "@/lib/generation/image-generation/image-generation-base";

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

type GeneratedMessageImageResult = {
  imageUrl: string;
  mediaId: string;
  mediaGenerationId: string;
};

async function processAndSaveMessageImage(
  imageResult: ImageGenerationResult,
  index: number
): Promise<GeneratedMessageImageResult | null> {
  try {
    const [processedImage, processedThumbnail] = await processImage(
      imageResult.image,
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

    const mediaId = `med_${nanoid(32)}`;
    const mediaGenerationId = `mdg_${nanoid()}`;

    const mainFilePath = `media/${mediaId}.webp`;
    const thumbnailFilePath = `media/${mediaId}_thumb.webp`;

    await Promise.all([
      uploadToBunny(mainFilePath, processedImage),
      uploadToBunny(thumbnailFilePath, processedThumbnail),
    ]);

    return {
      imageUrl: `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/${mainFilePath}`,
      mediaId,
      mediaGenerationId,
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        index,
      },
      `Failed to process/save message image ${index}`
    );
    return null;
  }
}

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
      limit: 2,
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

    const imagesPerGeneration = getImagesPerGeneration(modelId, {
      withReferenceImages: mode === "character",
    });

    // Generate images with reference images if available (character mode only)
    let generateImageResult;
    try {
      generateImageResult = await imageGenerationModel.generateMultiple(
        imagePrompt,
        {
          numberResults: imagesPerGeneration,
          ...(referenceImages.length > 0 ? { referenceImages } : {}),
        }
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

    const processedResults = await Promise.all(
      generateImageResult.images.map((imageResult, index) =>
        processAndSaveMessageImage(imageResult, index)
      )
    );

    const successfulResults = processedResults.filter(
      (result): result is GeneratedMessageImageResult => result !== null
    );

    if (successfulResults.length === 0) {
      throw new Error("All images failed to process and save");
    }

    logger.info(
      {
        requested: imagesPerGeneration,
        generated: generateImageResult.images.length,
        generationFailed: generateImageResult.failedCount,
        processingFailed:
          generateImageResult.images.length - successfulResults.length,
        successful: successfulResults.length,
      },
      "Message image generation completed"
    );

    const firstImage = successfulResults[0];
    const mediaEntries = successfulResults.map((result) => ({
      id: result.mediaId,
      type: "image" as const,
    }));

    // Insert media and mediaGenerations in transaction
    await db.transaction(async (tx) => {
      for (const [index, result] of successfulResults.entries()) {
        await tx.insert(mediaGenerations).values({
          id: result.mediaGenerationId,
          metadata: {
            chatId,
            messageId,
            personaId: chatPersona.personaId,
            prompt: imagePrompt,
            aiModel: imageGenerationModel.modelId,
            runId: ctx.run.id,
            imageIndex: index,
          },
          settings: {
            modelId,
            mode,
            referenceImages:
              referenceImages.length > 0 ? referenceImages : null,
          },
          status: "success",
          completedAt: new Date(),
        });

        await tx.insert(media).values({
          id: result.mediaId,
          personaId: chatPersona.personaId,
          userId,
          chatId,
          generationId: result.mediaGenerationId,
          type: "image",
          visibility: "private",
          nsfw: "sfw", // Chat images default to SFW
          metadata: {
            messageId,
          },
        });
      }

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
            } #> '{media}', '[]'::jsonb) || ${JSON.stringify(mediaEntries)}::jsonb
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
            ${JSON.stringify(firstImage.mediaId)}::jsonb
          )`,
        })
        .where(
          and(
            eq(chats.id, chatId),
            sql`${chats.settings} #>> '{sceneImageMediaId}' IS NULL`
          )
        );
    });

    // Invalidate chat cache after potential settings update via internal Route Handler
    await revalidateCacheTag(`chat:${chatId}`);

    logger.flush();

    return {
      images: successfulResults.map((result) => ({
        imageUrl: result.imageUrl,
        mediaId: result.mediaId,
      })),
      imageUrl: firstImage.imageUrl,
      mediaId: firstImage.mediaId,
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
