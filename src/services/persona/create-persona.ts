import { db } from "@/db/drizzle";
import { personas, personaVersions } from "@/db/schema";
import { PersonaData } from "@/schemas";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

type CreatePersonaPayload = {
  userId: string;

  prompt: string;

  aiNote?: string;
  aiModel: string;

  title: string;
  data: PersonaData;
};

export const createPersona = async (payload: CreatePersonaPayload) => {
  const personaId = `prs_${nanoid()}`;
  const versionId = `prv_${nanoid()}`;

  const title =
    payload.title && payload.title.length < 3
      ? payload.data.name
      : payload.title ?? payload.data.name;

  await db.transaction(async (tx) => {
    await tx.insert(personas).values({
      id: personaId,
      title: payload.title,
      userId: payload.userId,
    });

    await tx.insert(personaVersions).values({
      personaId,
      versionNumber: 1,
      data: payload.data,
      id: versionId,
      aiModel: payload.aiModel,
      title: payload.title,
      metadata: {
        userMessage: payload.prompt,
        aiNote: payload.aiNote,
      },
    });

    await tx
      .update(personas)
      .set({
        currentVersionId: versionId,
      })
      .where(eq(personas.id, personaId));
  });

  return {
    personaId,
    versionId,
  };
};
