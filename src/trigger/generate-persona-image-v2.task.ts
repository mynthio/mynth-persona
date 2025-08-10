import { db } from "@/db/drizzle";
import {
  imageGenerations,
  images,
  personaEvents,
  personas,
  tokenTransactions,
  userTokens,
} from "@/db/schema";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { PersonaWithVersion } from "@/types/persona.type";
import logsnag from "@/lib/logsnag";
import { craftImagePromptForPersonaTask } from "./craft-image-prompt-for-persona.task";
import { ImageGenerationQuality } from "@/types/image-generation/image-generation-quality.type";
import { ImageGenerationFactory } from "@/lib/generation/image-generation/image-generation-factory";
import { logger } from "@/lib/logger";
import { processImage } from "@/lib/image-processing/image-processor";
import { uploadToBunny } from "@/lib/upload";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { refundTokens } from "@/services/token/token-manager.service";

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
  eventId: z.string(),
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

export const generatePersonaImageV2Task = task({
  id: "generate-persona-image-v2",
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
        payload.tokensFromPurchased,
        "Image generation failed"
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
      eventId: imageGenerationEventId,
      quality,
      style,
      shotType,
      nsfw,
      userNote,
    } = payload;

    const taskLogger = logger.child({
      userId,
      meta: {
        who: "trigger:tasks:generate-persona-image-v2",
      },
    });

    // Get the appropriate model based on quality
    let imageGenerationModel = ImageGenerationFactory.byQuality(quality);

    if (quality === "high" && nsfw) {
      imageGenerationModel = ImageGenerationFactory.byModelId(
        "black-forest-labs/flux-1-pro"
      );
    }

    /**
     * TODO: Generate a prompt for image model
     * Since currently we support only FLUX models, we can simplify the logic for now and just use a task without
     * additional options. As we start to support StableDiffusion models, we will need to create different pormpts
     * thus model selection for image will need to be done before this step. Now we can skip it.
     */
    const imagePrompt =
      quality === "low"
        ? { ok: true, output: { prompt: persona.version.data.appearance } }
        : await craftImagePromptForPersonaTask.triggerAndWait({
            personaData: persona.version?.data,
            modelName: imageGenerationModel.displayName,
            options: {
              style,
              shotType,
              nsfw,
              userNote,
            },
          });

    if (!imagePrompt.ok) {
      throw new Error("Failed to generate image prompt");
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
      imagePrompt.output.prompt,
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
    const imageId = `img_${nanoid()}`;
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
      });

      await tx.insert(imageGenerations).values({
        id: imageGenerationId,
        aiModel: imageGenerationModel.modelId,
        eventId: imageGenerationEventId,
        prompt: imagePrompt.output.prompt,
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

      await tx
        .update(personaEvents)
        .set({
          aiNote: "Image generated",
        })
        .where(eq(personaEvents.id, payload.eventId));

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

    return {
      imageUrl,
      imageId,
    };
  },
});
