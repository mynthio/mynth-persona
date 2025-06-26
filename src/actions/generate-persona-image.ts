"use server";

import { auth } from "@clerk/nextjs/server";
import "server-only";
import { tasks } from "@trigger.dev/sdk/v3";
import { db } from "@/db/drizzle";
import { personaEvents, personas } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generatePersonaImageTask } from "@/trigger/generate-persona-image.task";
import { spendTokens } from "@/services/token/token-manager.service";
import { nanoid } from "nanoid";

export const generatePersonaImage = async (personaId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.id, personaId), eq(personas.userId, userId)),
    with: {
      currentVersion: true,
    },
  });

  if (!persona) {
    throw new Error("Persona not found");
  }

  const canUserExecuteAction = await spendTokens(userId, 5);

  if (canUserExecuteAction.success === false) {
    throw new Error("Not enough tokens");
  }

  const [event] = await db
    .insert(personaEvents)
    .values({
      personaId,
      userMessage: "Generate Image",
      eventType: "image_generate",
      id: `pev_${nanoid()}`,
      userId,
      versionId: persona.currentVersionId,
    })
    .returning();

  const taskHandle = await tasks.trigger<typeof generatePersonaImageTask>(
    "generate-persona-image",
    {
      // @ts-expect-error - TODO: fix this
      persona,
      userId,
      cost: 5,
      eventId: event.id,
    }
  );

  return {
    taskId: taskHandle.id,
    publicAccessToken: taskHandle.publicAccessToken,
    cost: 5,
    remainingBalance: canUserExecuteAction.remainingBalance,
    event: {
      ...event,
      imageGenerations: [
        {
          id: taskHandle.id,
          status: "pending",
          runId: taskHandle.id,
          imageId: "",
          accessToken: taskHandle.publicAccessToken,
        },
      ],
    },
  };
};
