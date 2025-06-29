import { db } from "@/db/drizzle";
import {
  imageGenerations,
  images,
  personaEvents,
  personas,
  tokenTransactions,
  userTokens,
} from "@/db/schema";
import { logger, metadata, task, wait } from "@trigger.dev/sdk/v3";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { nanoid } from "nanoid";

import { ImageGenerationFactory } from "@/lib/generation/image-generation/image-generation-factory";
import { PersonaWithCurrentVersion } from "@/types/persona.type";

type GeneratePersonaImageTaskPayload = {
  persona: PersonaWithCurrentVersion;
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
    console.log("Generating persona image failed", { payload, error, params });
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

    // Return tokens to user due to failure
    const [userToken] = await db
      .update(userTokens)
      .set({
        balance: sql`balance + ${payload.cost}`,
      })
      .where(eq(userTokens.userId, payload.userId))
      .returning();

    await db.insert(tokenTransactions).values({
      id: `ttx-${nanoid()}`,
      userId: payload.userId,
      type: "refund",
      amount: payload.cost,
      balanceAfter: userToken.balance,
    });
  },
  run: async (payload: GeneratePersonaImageTaskPayload, { ctx }) => {
    console.log("Generating persona image", { payload, ctx });

    const persona = payload.persona;

    const imageGenerationId = `igg-${nanoid()}`;

    metadata.set("imageGenerationId", imageGenerationId);

    await db.insert(imageGenerations).values({
      id: imageGenerationId,
      aiModel: "bytedance/stable-diffusion-xl-lightning",
      systemPromptId: "1",
      prompt: persona.currentVersion?.personaData?.appearance,
      userId: payload.userId,
      personaId: persona.id,
      eventId: payload.eventId,
      status: "pending",
      tokensCost: 5,
      runId: ctx.run.id,
    });

    console.log("Generating persona image", { persona });

    const imageGeneration = ImageGenerationFactory.byQuality("low");

    const result = await imageGeneration.generate(
      persona.currentVersion?.personaData?.appearance
    );

    const processedImageWebp = await sharp(result.image).webp().toBuffer();

    // Upload to Bunny.net storage using fetch API
    const imageId = `img-${nanoid()}`;
    const filePath = `personas/${imageId}.webp`;
    const uploadUrl = `https://ny.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${filePath}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: process.env.BUNNY_STORAGE_ZONE_KEY!,
        "Content-Type": "application/octet-stream",
        accept: "application/json",
      },
      body: processedImageWebp,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    }

    const imageUrl = `https://${process.env.BUNNY_STORAGE_ZONE}.b-cdn.net/${filePath}`;

    await db.insert(images).values({
      id: imageId,
      personaId: persona.id,
      url: imageUrl,
    });

    await db
      .update(imageGenerations)
      .set({
        status: "completed",
        completedAt: new Date(),
        imageId: imageId,
      })
      .where(eq(imageGenerations.id, imageGenerationId));

    await db
      .update(personaEvents)
      .set({
        aiNote: "Image generated",
      })
      .where(eq(personaEvents.id, payload.eventId));

    return {
      imageUrl,
      imageId,
    };
  },
});
