import { db } from "@/db/drizzle";
import { personaEvents, personas, personaVersions } from "@/db/schema";
import { PersonaData } from "@/types/persona.type";
import { eq, max } from "drizzle-orm";
import { nanoid } from "nanoid";

type CreatePersonaVersionPayload = {
  personaId: string;
  personaEventId: string;
  data: PersonaData;
  aiModel: string;
  aiNote?: string;
  versionNumber?: number;
  title?: string;
  changedProperties?: string[]; // Can now include things like 'extensions.skills'
};

export const createPersonaVersion = async (
  payload: CreatePersonaVersionPayload
) => {
  const id = `prv_${nanoid()}`;

  await db.transaction(async (tx) => {
    let versionNumber = payload.versionNumber;

    if (!versionNumber) {
      // Get the highest version number for this persona
      const maxVersionResult = await tx
        .select({ maxVersion: max(personaVersions.versionNumber) })
        .from(personaVersions)
        .where(eq(personaVersions.personaId, payload.personaId));

      // If no versions exist, start at 1, otherwise increment the max
      const currentMaxVersion = maxVersionResult[0]?.maxVersion ?? 0;
      versionNumber = currentMaxVersion + 1;
    }

    await tx.insert(personaVersions).values({
      id,
      personaId: payload.personaId,
      versionNumber,
      data: payload.data,
      aiModel: payload.aiModel,
      settings: {
        system: "1.0.0",
      },
      title: payload.title,
      changedProperties: payload.changedProperties,
    });

    await tx
      .update(personas)
      .set({
        currentVersionId: id,
        title: payload.title,
      })
      .where(eq(personas.id, payload.personaId));

    await tx
      .update(personaEvents)
      .set({
        versionId: id,
        aiNote: payload.aiNote,
      })
      .where(eq(personaEvents.id, payload.personaEventId));
  });
};
