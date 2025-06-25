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
import { nanoid } from "nanoid";
import { fal } from "@fal-ai/client";
import sharp from "sharp";
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
      status: "pending",
      tokensCost: 5,
      runId: ctx.run.id,
    });

    console.log("Generating persona image", { persona });

    const result = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/mynth-persona-local/workers-ai/@cf/bytedance/stable-diffusion-xl-lightning`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN}`,
        },
        body: JSON.stringify({
          prompt: persona.currentVersion?.personaData?.appearance,
        }),
      }
    );

    console.log("Result", { result });

    const arrayBuffer = await result.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const processedImageWebp = await sharp(imageBuffer).webp().toBuffer();

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

    // Construct the public URL for the uploaded image
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
        imageId,
      })
      .where(eq(imageGenerations.id, imageGenerationId));

    await db
      .update(personaEvents)
      .set({
        aiNote: "Image generated",
        imageGenerationId,
      })
      .where(eq(personaEvents.id, payload.eventId));

    return {
      imageUrl,
      imageId,
    };
  },
});

// FALAI

// logger.log("Generating persona image", { payload, ctx });

//     const persona = await db.query.personas.findFirst({
//       where: and(
//         eq(personas.id, payload.personaId),
//         eq(personas.userId, payload.userId)
//       ),
//       with: {
//         currentVersion: true,
//       },
//     });

//     if (!persona) {
//       throw new Error("Persona not found");
//     }

//     console.log("Generating persona image", { persona });

//     const result = await fal.subscribe("fal-ai/hidream-i1-fast", {
//       input: {
//         // @ts-expect-error - TODO: fix this
//         prompt: persona.currentVersion?.personaData?.appearance,
//       },
//       logs: true,
//       onQueueUpdate: (update) => {
//         if (update.status === "IN_PROGRESS") {
//           update.logs.map((log) => log.message).forEach(console.log);
//         }
//       },
//     });

//     const [{ url: falImageUrl }] = result.data.images;

//     // Download the cartoon image
//     const imageResponse = await fetch(falImageUrl);
//     const imageBuffer = await imageResponse.arrayBuffer().then(Buffer.from);

//     const processedImageWebp = await sharp(imageBuffer).webp().toBuffer();

//     // Upload to Bunny.net storage using fetch API
//     const fileName = `${nanoid()}.webp`;
//     const filePath = `personas/${persona.id}/${fileName}`;
//     const uploadUrl = `https://ny.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${filePath}`;

//     const uploadResponse = await fetch(uploadUrl, {
//       method: "PUT",
//       headers: {
//         AccessKey: process.env.BUNNY_STORAGE_ZONE_KEY!,
//         "Content-Type": "application/octet-stream",
//         accept: "application/json",
//       },
//       body: processedImageWebp,
//     });

//     if (!uploadResponse.ok) {
//       throw new Error(
//         `Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`
//       );
//     }

//     // Construct the public URL for the uploaded image
//     const imageUrl = `https://${process.env.BUNNY_STORAGE_ZONE}.b-cdn.net/${filePath}`;

//     return {
//       imageUrl,
//     };
//   },
