"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, ne } from "drizzle-orm";

export type PersonaVisibility = "private" | "deleted";

export async function updatePersonaVisibilityAction(
  personaId: string,
  visibility: PersonaVisibility
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

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
      publishedAt: true,
      deletedAt: true,
    },
  });

  if (!persona) {
    throw new Error("Persona not found");
  }

  if (visibility === "private") {
    if (persona.visibility === "deleted") {
      throw new Error("Persona is deleted");
    }

    // Prevent unpublishing public personas
    if (persona.visibility === "public") {
      throw new Error(
        "Cannot unpublish a public persona. By publishing, you granted us a perpetual license to use the persona for content generation. If you have an exceptional reason for removal (such as legal concerns or policy violations), please contact us at hi@prsna.app or Discord."
      );
    }

    await db
      .update(personas)
      .set({
        visibility: "private",
        publicVersionId: null,
        publishedAt: null,
      })
      .where(and(eq(personas.id, personaId), eq(personas.userId, userId)));

    return { success: true, visibility: "private" as const };
  }

  if (visibility === "deleted") {
    if (persona.visibility === "deleted") {
      // Idempotent: already deleted
      return { success: true, visibility: "deleted" as const };
    }

    // Prevent deleting public personas
    if (persona.visibility === "public") {
      throw new Error(
        "Cannot delete a public persona. By publishing, you granted us a perpetual license to use the persona for content generation. If you have an exceptional reason for removal (such as legal concerns or policy violations), please contact us at hi@prsna.app or Discord."
      );
    }

    await db
      .update(personas)
      .set({
        visibility: "deleted",
        deletedAt: new Date(),
        publicVersionId: null,
        publishedAt: null,
      })
      .where(and(eq(personas.id, personaId), eq(personas.userId, userId)));

    return { success: true, visibility: "deleted" as const };
  }

  // Should never reach here due to type, but safe-guard
  throw new Error("Unsupported visibility state");
}
