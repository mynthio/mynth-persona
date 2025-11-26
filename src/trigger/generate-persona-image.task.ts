import { db } from "@/db/drizzle";
import { media, mediaGenerations, personas } from "@/db/schema";
import { metadata, task } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { PersonaWithVersion } from "@/types/persona.type";
import logsnag from "@/lib/logsnag";
import {
  ImageModelId,
  IMAGE_MODELS,
  getImagesPerGeneration,
} from "@/config/shared/image-models";
import { ImageGenerationFactory } from "@/lib/generation/image-generation/image-generation-factory";
import { processImage } from "@/lib/image-processing/image-processor";
import { uploadToBunny } from "@/lib/upload";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { craftImagePromptForPersona } from "./utils/generate-persona-image-prompt";
import { logger } from "@/lib/logger";
import {
  getImageRateLimiterForPlan,
  imageRateLimitRestore,
} from "@/lib/rate-limit-image";
import { PlanId } from "@/config/shared/plans";
import { decrementConcurrentImageJob } from "@/lib/concurrent-image-jobs";
import { ImageGenerationResult } from "@/lib/generation/image-generation/image-generation-base";

// Zod schema for input validation
const GeneratePersonaImageTaskPayloadSchema = z.object({
  persona: z.object({
    id: z.string(),
    version: z
      .object({
        data: z.record(z.string(), z.any()),
      })
      .nullable(),
  }),
  userId: z.string(),

  modelId: z.string(),
  style: z.string(),
  shotType: z.string(),
  nsfw: z.boolean().default(false),
  userNote: z.string().default(""),
  cost: z.number(),
  planId: z.string(),
});

type GeneratePersonaImageTaskPayload = z.infer<
  typeof GeneratePersonaImageTaskPayloadSchema
> & {
  persona: PersonaWithVersion;
  modelId: ImageModelId;
  style: ImageStyle;
  shotType: ShotType;
  planId: PlanId;
};

type GeneratedImageResult = {
  imageUrl: string;
  mediaId: string;
};

/**
 * Process a single image: resize, create thumbnail, upload, and save to DB
 */
async function processAndSaveImage(
  imageResult: ImageGenerationResult,
  index: number,
  ctx: {
    userId: string;
    persona: PersonaWithVersion;
    modelId: ImageModelId;
    imagePrompt: string;
    negativePrompt: string | undefined;
    style: ImageStyle;
    shotType: ShotType;
    nsfw: boolean;
    userNote: string;
    cost: number;
    runId: string;
    imageGenerationModelId: string;
    isFirstImage: boolean;
  }
): Promise<GeneratedImageResult | null> {
  try {
    /**
     * Process Image
     * - Format to webp using same size
     * - Create thumbnail
     */
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

    // Upload to Bunny.net storage using upload service
    const mediaId = `med_${nanoid(32)}`;
    const mediaGenerationId = `mdg_${nanoid()}`;

    const mainFilePath = `media/${mediaId}.webp`;
    const thumbnailFilePath = `media/${mediaId}_thumb.webp`;

    // Upload main and thumbnail in parallel
    await Promise.all([
      uploadToBunny(mainFilePath, processedImage),
      uploadToBunny(thumbnailFilePath, processedThumbnail),
    ]);

    const imageUrl = `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/${mainFilePath}`;

    await db.transaction(async (tx) => {
      await tx.insert(mediaGenerations).values({
        id: mediaGenerationId,
        metadata: {
          personaId: ctx.persona.id,
          prompt: ctx.imagePrompt,
          negativePrompt: ctx.negativePrompt,
          aiModel: ctx.imageGenerationModelId,
          runId: ctx.runId,
          imageIndex: index,
        },
        settings: {
          modelId: ctx.modelId,
          style: ctx.style,
          shotType: ctx.shotType,
          nsfw: ctx.nsfw,
          userNote: ctx.userNote,
        },
        cost: ctx.cost,
        status: "success",
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      });

      await tx.insert(media).values({
        id: mediaId,
        personaId: ctx.persona.id,
        userId: ctx.userId,
        generationId: mediaGenerationId,
        visibility: "private",
        metadata: {},
        type: "image",
        nsfw: ctx.nsfw ? "explicit" : "sfw",
        createdAt: new Date(),
      });

      /**
       * Set persona profile image if empty (only for first image)
       */
      if (ctx.isFirstImage && !ctx.persona.profileImageIdMedia) {
        await tx
          .update(personas)
          .set({
            profileImageIdMedia: mediaId,
          })
          .where(eq(personas.id, ctx.persona.id));
      }
    });

    return {
      imageUrl,
      mediaId,
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        index,
        personaId: ctx.persona.id,
      },
      `Failed to process/save image ${index}`
    );
    return null;
  }
}

export const generatePersonaImageTask = task({
  id: "generate-persona-image",
  maxDuration: 300,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: GeneratePersonaImageTaskPayload, { ctx }) => {
    /**
     * Validate input data with Zod schema
     */
    const validationResult =
      GeneratePersonaImageTaskPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      throw new Error(`Invalid payload: ${validationResult.error.message}`);
    }

    /**
     * Get data from payload
     */
    const { userId, persona, modelId, style, shotType, nsfw, userNote } =
      payload;

    // Get the appropriate model based on modelId
    const imageGenerationModel = ImageGenerationFactory.byModelId(modelId);

    // Get number of images to generate based on model config
    const imagesPerGeneration = getImagesPerGeneration(modelId);

    let imagePrompt = metadata.get("imagePrompt") as string | undefined;
    let negativePrompt = metadata.get("negativePrompt") as string | undefined;

    if (!imagePrompt) {
      const imageGenerationResult = await craftImagePromptForPersona({
        personaData: persona.version?.data,
        modelName: imageGenerationModel.displayName,
        options: {
          style,
          shotType,
          nsfw,
          userNote,
        },
      });

      if (!imageGenerationResult?.prompt) {
        throw new Error("Failed to generate image prompt");
      }

      imagePrompt = imageGenerationResult.prompt;
      negativePrompt = imageGenerationResult.negativePrompt;
      metadata.set("imagePrompt", imagePrompt);
      if (negativePrompt) {
        metadata.set("negativePrompt", negativePrompt);
      }
    }

    // Generate images using model (single or multiple based on config)
    const generateResult = await imageGenerationModel.generateMultiple(
      imagePrompt,
      {
        negativePrompt,
        numberResults: imagesPerGeneration,
      }
    );

    // Process and save all images in parallel
    const processPromises = generateResult.images.map((imageResult, index) =>
      processAndSaveImage(imageResult, index, {
        userId,
        persona,
        modelId,
        imagePrompt: imagePrompt!,
        negativePrompt,
        style,
        shotType,
        nsfw,
        userNote,
        cost: payload.cost,
        runId: ctx.run.id,
        imageGenerationModelId: imageGenerationModel.modelId,
        isFirstImage: index === 0,
      })
    );

    const processResults = await Promise.all(processPromises);

    // Filter out failed processing
    const successfulResults = processResults.filter(
      (r): r is GeneratedImageResult => r !== null
    );

    // If ALL processing failed, throw an error (this will trigger credits restore)
    if (successfulResults.length === 0) {
      throw new Error("All images failed to process and save");
    }

    logger.info(
      {
        requested: imagesPerGeneration,
        generated: generateResult.images.length,
        generationFailed: generateResult.failedCount,
        processingFailed:
          generateResult.images.length - successfulResults.length,
        successful: successfulResults.length,
      },
      "Image generation completed"
    );

    logger.flush();

    // Return array of results for UI to handle
    return {
      images: successfulResults,
      // Keep legacy fields for backwards compatibility
      imageUrl: successfulResults[0]?.imageUrl,
      mediaId: successfulResults[0]?.mediaId,
    };
  },
  onFailure: async ({ payload, error }) => {
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
        channel: "persona-image-generation",
        event: "image-generation-completed",
        description: "Image generation completed",
        icon: "🖼️",
        user_id: payload.userId,
      })
      .catch(() => {});
  },
});
