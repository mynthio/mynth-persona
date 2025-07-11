"use server";

import { db } from "@/db/drizzle";
import { personaEvents, personas, personaVersions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
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
   * Now we will set the current version for persona adding a new event and settign active version
   */

  await db.transaction(async (tx) => {
    const updateResult = await tx
      .update(personas)
      .set({
        currentVersionId: versionId,
      })
      .where(and(eq(personas.id, personaId), eq(personas.userId, userId)));

    await tx.insert(personaEvents).values({
      id: `pse_${nanoid()}`,
      personaId,
      userId,
      type: "persona_revert",
      userMessage: `Revert to ${maybeVersion.versionNumber} version`,
      versionId: maybeVersion.id,
    });
  });

  return {
    success: true,
  };
}
