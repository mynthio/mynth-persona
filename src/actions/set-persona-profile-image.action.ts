"use server";

import { db } from "@/db/drizzle";
import { media, personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import "server-only";
import { z } from "zod";

// Zod schema for validation
const SetPersonaProfileImageSchema = z.object({
  mediaId: z
    .string()
    .min(1, "Media ID is required")
    .startsWith("med_", "Invalid media ID format"),
});

export async function setPersonaProfileImage(mediaId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Validate input with Zod
  const validationResult = SetPersonaProfileImageSchema.safeParse({ mediaId });
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`);
  }

  // Get media and persona in a single query to validate ownership
  const mediaWithPersona = await db.query.media.findFirst({
    where: eq(media.id, mediaId),
    columns: {
      id: true,
      personaId: true,
    },
    with: {
      persona: {
        columns: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!mediaWithPersona) {
    throw new Error("Media not found");
  }

  if (mediaWithPersona.persona.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Update persona profile image
  await db
    .update(personas)
    .set({
      profileImageIdMedia: mediaId,
    })
    .where(
      and(
        eq(personas.id, mediaWithPersona.personaId),
        eq(personas.userId, userId)
      )
    );

  return {
    success: true,
  };
}