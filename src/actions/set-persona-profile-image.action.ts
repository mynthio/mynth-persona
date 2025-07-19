"use server";

import { db } from "@/db/drizzle";
import { images, personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import "server-only";
import { z } from "zod";

// Zod schema for validation
const SetPersonaProfileImageSchema = z.object({
  imageId: z
    .string()
    .min(1, "Image ID is required")
    .startsWith("img_", "Invalid image ID format"),
});

export async function setPersonaProfileImage(imageId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Validate input with Zod
  const validationResult = SetPersonaProfileImageSchema.safeParse({ imageId });
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`);
  }

  // Get image and persona in a single query to validate ownership
  const imageWithPersona = await db.query.images.findFirst({
    where: eq(images.id, imageId),
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

  if (!imageWithPersona) {
    throw new Error("Image not found");
  }

  if (imageWithPersona.persona.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Update persona profile image
  await db
    .update(personas)
    .set({
      profileImageId: imageId,
    })
    .where(
      and(
        eq(personas.id, imageWithPersona.personaId),
        eq(personas.userId, userId)
      )
    );

  return {
    success: true,
  };
}