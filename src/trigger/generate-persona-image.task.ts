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
import sharp from "sharp";
import { nanoid } from "nanoid";

import { ImageGenerationFactory } from "@/lib/generation/image-generation/image-generation-factory";
import { PersonaWithVersion } from "@/types/persona.type";
import { logger } from "@/lib/logger";
import logsnag from "@/lib/logsnag";

type GeneratePersonaImageTaskPayload = {
  persona: PersonaWithVersion;
  cost: number;
  userId: string;
  eventId: string;
};

export const generatePersonaImageTask = task({
  id: "generate-persona-image",
  maxDuration: 300,
  retry: {
    maxAttempts: 1,
  },
  onFailure: async (
    payload: GeneratePersonaImageTaskPayload,
    error,
    params
  ) => {
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
      // Return tokens to user due to failure
      const [userToken] = await db
        .update(userTokens)
        .set({
          balance: sql`balance + ${payload.cost}`,
        })
        .where(eq(userTokens.userId, payload.userId))
        .returning();

      await db.insert(tokenTransactions).values({
        id: `ttx_${nanoid()}`,
        userId: payload.userId,
        type: "refund",
        amount: payload.cost,
        balanceAfter: userToken.balance,
      });
    }
  },
  onSuccess: async (
    payload: GeneratePersonaImageTaskPayload,
    result,
    params
  ) => {
    try {
      await logsnag.track({
        channel: "persona-image-generation",
        event: "image-generation-completed",
        description: "Image generation completed",
        icon: "🖼️",
        user_id: payload.userId,
      });
    } catch (error) {
      // noop
    }
  },
  run: async (payload: GeneratePersonaImageTaskPayload, { ctx }) => {
    const persona = payload.persona;

    const imageGenerationId = `igg_${nanoid()}`;

    metadata.set("imageGenerationId", imageGenerationId);

    await db.insert(imageGenerations).values({
      id: imageGenerationId,
      aiModel: "bytedance/stable-diffusion-xl-lightning",
      prompt: persona.version?.data?.appearance,
      userId: payload.userId,
      personaId: persona.id,
      eventId: payload.eventId,
      status: "pending",
      tokensCost: payload.cost,
      runId: ctx.run.id,
    });

    const imageGeneration = ImageGenerationFactory.byQuality("low");

    logger.debug({
      meta: {
        userId: payload.userId,
        runId: ctx.run.id,
        imageGenerationId,
        who: "generate-persona-image-task",
        what: "image-generation-model-selection",
      },
      data: {
        modelId: imageGeneration.modelId,
        internalModelId: imageGeneration.internalId,
      },
    });

    const result = await imageGeneration.generate(
      persona.version?.data?.appearance
    );

    /**
     * TODO: Add a pricing to configuration, so we can log and calculate the cost of image generation when possible.
     * It can be quite a nice data to have, for some dashboards and analytics.
     */
    logger.info({
      meta: {
        who: "generate-persona-image-task",
        what: "image-generation-result",
        modelId: imageGeneration.modelId,
        internalModelId: imageGeneration.internalId,
        imageGenerationId,
        userId: payload.userId,
        runId: ctx.run.id,
      },
      data: {},
    });

    const processedImageWebp = await sharp(result.image).webp().toBuffer();
    const processedThumbnailWebp = await sharp(result.image)
      .resize(240, 240, { fit: "cover", position: "center" })
      .webp({
        quality: 80,
        effort: 4,
      })
      .toBuffer();

    // Upload to Bunny.net storage using fetch API
    const imageId = `img_${nanoid()}`;
    const mainFilePath = `personas/${imageId}.webp`;
    const thumbnailFilePath = `personas/${imageId}_thumb.webp`;

    const uploadMainImage = fetch(
      `https://ny.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${mainFilePath}`,
      {
        method: "PUT",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_ZONE_KEY!,
          "Content-Type": "application/octet-stream",
          accept: "application/json",
        },
        body: processedImageWebp,
      }
    );

    const uploadThumbnailImage = fetch(
      `https://ny.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${thumbnailFilePath}`,
      {
        method: "PUT",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_ZONE_KEY!,
          "Content-Type": "application/octet-stream",
          accept: "application/json",
        },
        body: processedThumbnailWebp,
      }
    );

    const [mainResponse, thumbnailResponse] = await Promise.all([
      uploadMainImage,
      uploadThumbnailImage,
    ]);

    if (!mainResponse.ok) {
      throw new Error(
        `Failed to upload main image: ${mainResponse.status} ${mainResponse.statusText}`
      );
    }

    if (!thumbnailResponse.ok) {
      throw new Error(
        `Failed to upload thumbnail image: ${thumbnailResponse.status} ${thumbnailResponse.statusText}`
      );
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/${mainFilePath}`;

    await db.transaction(async (tx) => {
      await tx.insert(images).values({
        id: imageId,
        personaId: persona.id,
      });

      await tx
        .update(imageGenerations)
        .set({
          status: "completed",
          completedAt: new Date(),
          imageId: imageId,
        })
        .where(eq(imageGenerations.id, imageGenerationId));

      await tx
        .update(personaEvents)
        .set({
          aiNote: "Image generated",
        })
        .where(eq(personaEvents.id, payload.eventId));

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
