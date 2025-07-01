import { db } from "@/db/drizzle";
import { personaEvents, personas } from "@/db/schema";
import { nanoid } from "nanoid";

type CreatePersonaPayload = {
  userId: string;
  prompt: string;
};

export const createPersona = async (payload: CreatePersonaPayload) => {
  const personaId = `prs_${nanoid()}`;
  const personaEventId = `pse_${nanoid()}`;

  await db.transaction(async (tx) => {
    await tx.insert(personas).values({
      id: personaId,
      userId: payload.userId,
    });

    await tx.insert(personaEvents).values({
      id: personaEventId,
      personaId,
      userId: payload.userId,
      type: "persona_create",
      userMessage: payload.prompt,
    });
  });

  return {
    personaId,
    personaEventId,
  };
};
