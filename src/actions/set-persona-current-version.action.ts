"use server";

import { db } from "@/db/drizzle";
import { personas, personaVersions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import "server-only";

export async function setPersonaCurrentVersion(
  personaId: string,
  versionId: string
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // validate if version is part of the persona
  const maybeVersion = await db.query.personaVersions.findFirst({
    where: and(
      eq(personaVersions.id, versionId),
      eq(personaVersions.personaId, personaId)
    ),
    columns: {
      id: true,
      versionNumber: true,
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

  if (!maybeVersion) {
    throw new Error("Unauthorized");
  }

  if (maybeVersion.persona.userId !== userId) {
    throw new Error("Unauthorized");
  }

  /**
   * Set the current version for persona by updating the active version
   */

  await db.transaction(async (tx) => {
    await tx
      .update(personas)
      .set({
        currentVersionId: versionId,
      })
      .where(and(eq(personas.id, personaId), eq(personas.userId, userId)));
  });

  return {
    success: true,
  };
}
