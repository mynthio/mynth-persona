"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, ne } from "drizzle-orm";
import { tasks } from "@trigger.dev/sdk";
import { publishPersonaTask } from "@/trigger/publish-persona.task";

export async function publishPersonaAction(personaId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Fetch persona and validate ownership + state
  const persona = await db.query.personas.findFirst({
    where: and(
      eq(personas.id, personaId),
      eq(personas.userId, userId),
      ne(personas.visibility, "deleted")
    ),
    columns: {
      id: true,
      visibility: true,
      publicVersionId: true,
      lastPublishAttempt: true,
      profileImageId: true,
      currentVersionId: true,
    },
  });

  if (!persona) {
    throw new Error("Persona not found");
  }

  if (!persona.currentVersionId) {
    throw new Error("Persona version is required to publish persona");
  }

  if (!persona.profileImageId) {
    throw new Error("Persona profile image is required to publish persona");
  }

  if (persona.visibility === "deleted") {
    throw new Error("Persona is deleted");
  }

  // Prevent publishing if already public and locked to a version
  if (persona.visibility === "public" && persona.publicVersionId) {
    throw new Error("Persona already published");
  }

  // Prevent double-enqueue if a publish attempt is already pending
  const lastAttempt = (persona.lastPublishAttempt ?? {}) as {
    status?: string;
    attemptedAt?: string;
    runId?: string | null;
  };
  if (lastAttempt.status === "pending") {
    throw new Error("Publish already in progress");
  }

  // Mark publish attempt as pending; the task will update this upon completion/failure
  await db
    .update(personas)
    .set({
      lastPublishAttempt: {
        status: "pending",
        attemptedAt: new Date().toISOString(),
      },
    })
    .where(eq(personas.id, personaId));

  // Enqueue Trigger.dev job to run the publishing pipeline
  const taskHandle = await tasks.trigger<typeof publishPersonaTask>(
    "publish-persona",
    {
      personaId,
      userId,
      versionId: persona.currentVersionId,
    }
  );

  return {
    success: true,
    status: "pending" as const,
    taskId: taskHandle.id,
    publicAccessToken: taskHandle.publicAccessToken,
  };
}
