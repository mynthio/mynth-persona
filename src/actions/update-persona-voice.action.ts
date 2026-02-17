"use server";
import "server-only";

import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { voiceIds } from "@/config/shared/voices.config";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function updatePersonaVoiceAction(
  personaId: string,
  voiceId: string | null
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Validate voiceId against curated list (null clears the voice)
  if (voiceId !== null && !voiceIds.has(voiceId)) {
    throw new Error("Invalid voice ID");
  }

  await db
    .update(personas)
    .set({ voiceId })
    .where(and(eq(personas.id, personaId), eq(personas.userId, userId)));

  return { success: true };
}
