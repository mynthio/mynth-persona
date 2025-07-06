"use server";

import { db } from "@/db/drizzle";
import { personaVersions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import "server-only";

export async function deletePersonaVersion(versionId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const maybeVersion = await db.query.personaVersions.findFirst({
    columns: {
      id: true,
    },
    where: eq(personaVersions.id, versionId),
    with: {
      persona: {
        columns: {
          id: true,
          currentVersionId: true,
          userId: true,
        },
      },
    },
  });

  if (!maybeVersion) {
    throw new Error("Unauthorized");
  }

  if (maybeVersion.persona.currentVersionId === maybeVersion.id) {
    throw new Error("You can't remove the current version of Persona");
  }

  if (maybeVersion.persona.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await db.delete(personaVersions).where(eq(personaVersions.id, versionId));

  return {
    success: true,
  };
}
