import { db } from "@/db/drizzle";
import { imageGenerations, images, personas } from "@/db/schema";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { PersonaWithVersion } from "@/types/persona.type";
import logsnag from "@/lib/logsnag";
import { ImageGenerationQuality } from "@/types/image-generation/image-generation-quality.type";
import { ImageGenerationFactory } from "@/lib/generation/image-generation/image-generation-factory";
import { processImage } from "@/lib/image-processing/image-processor";
import { uploadToBunny } from "@/lib/upload";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { refundTokens } from "@/services/token/token-manager.service";
import { craftImagePromptForPersona } from "./utils/generate-persona-image-prompt";
import { logger } from "@/lib/logger";

// Zod schema for input validation
const GeneratePersonaImageTaskPayloadSchema = z.object({
  persona: z.object({
    id: z.string(),
    version: z
      .object({
        data: z.record(z.any()),
      })
      .nullable(),
  }),
  cost: z.number().min(0),
  userId: z.string(),

  quality: z.enum(["low", "medium", "high"]),
  style: z.string(),
  shotType: z.string(),
  nsfw: z.boolean().default(false),
  userNote: z.string().default(""),
  tokensFromFree: z.number().min(0),
  tokensFromPurchased: z.number().min(0),
});

type GeneratePersonaImageTaskPayload = z.infer<
  typeof GeneratePersonaImageTaskPayloadSchema
> & {
  persona: PersonaWithVersion;
  quality: ImageGenerationQuality;
  style: ImageStyle;
  shotType: ShotType;
};

export const generatePersonaImageTask = task({
  id: "generate-persona-image",
  maxDuration: 300,
  retry: {
    maxAttempts: 1,
  },
  onFailure: async (payload: GeneratePersonaImageTaskPayload, error) => {
    const imageGenerationId = metadata.get("imageGenerationId")?.toString();

    if (imageGenerationId) {
      await db
        .update(imageGenerations)
        .set({
          status: "failed",
          errorMessage: String(error),
        })
        .where(eq(imageGenerations.id, imageGenerationId));
    }

    if (payload.cost > 0) {
      // Return tokens to user due to failure using proper token breakdown
      await refundTokens(
        payload.userId,
        payload.tokensFromFree,
        payload.tokensFromPurchased
      );
    }
  },
  onSuccess: async (payload: GeneratePersonaImageTaskPayload) => {
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
    const {
      userId,
      persona,

      quality,
      style,
      shotType,
      nsfw,
      userNote,
    } = payload;

    // Get the appropriate model based on quality
    let imageGenerationModel = ImageGenerationFactory.byQuality(quality);

    if (quality === "high" && nsfw) {
      imageGenerationModel = ImageGenerationFactory.byModelId(
        "black-forest-labs/flux-1-pro"
      );
    }

    let imagePrompt = metadata.get("imagePrompt") as string | undefined;

    if (!imagePrompt) {
      const imageGenerationResult =
        quality === "low"
          ? { prompt: persona.version?.data.appearance as string | undefined }
          : await craftImagePromptForPersona({
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
      metadata.set("imagePrompt", imagePrompt);
    }

    // Set resolution based on quality
    let width: number, height: number;
    if (quality === "high") {
      width = 864;
      height = 1152;
    } else if (quality === "medium") {
      width = 896;
      height = 1152;
    } else {
      width = 512;
      height = 512;
    }

    const generateImageResult = await imageGenerationModel.generate(
      imagePrompt,
      {
        width,
        height,
      }
    );

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

    // Upload to Bunny.net storage using upload service
    const imageId = `img_${nanoid(32)}`;
    const imageGenerationId = `igg_${nanoid()}`;

    const mainFilePath = `personas/${imageId}.webp`;
    const thumbnailFilePath = `personas/${imageId}_thumb.webp`;

    const uploadMainImage = uploadToBunny(mainFilePath, processedImage);
    const uploadThumbnailImage = uploadToBunny(
      thumbnailFilePath,
      processedThumbnail
    );

    await Promise.all([uploadMainImage, uploadThumbnailImage]);

    const imageUrl = `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/${mainFilePath}`;

    await db.transaction(async (tx) => {
      await tx.insert(images).values({
        id: imageId,
        personaId: persona.id,
        isNSFW: nsfw,
      });

      await tx.insert(imageGenerations).values({
        id: imageGenerationId,
        aiModel: imageGenerationModel.modelId,

        prompt: imagePrompt,
        userId,
        personaId: persona.id,
        settings: {
          quality,
          style,
          shotType,
          nsfw,
          userNote,
        },
        status: "completed",
        completedAt: new Date(),
        imageId: imageId,
        runId: ctx.run.id,
        tokensCost: payload.cost,
      });

      /**
       * Set persona profile image if empty
       */
      if (!persona.profileImageId) {
        await tx
          .update(personas)
          .set({
            profileImageId: imageId,
          })
          .where(eq(personas.id, persona.id));
      }
    });

    logger.flush();

    return {
      imageUrl,
      imageId,
    };
  },
});
