import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { nanoid } from "nanoid";

type CreatePersonaPayload = {
  userId: string;
  prompt: string;
};

export const createPersona = async (payload: CreatePersonaPayload) => {
  const personaId = `prs_${nanoid()}`;

  await db.transaction(async (tx) => {
    await tx.insert(personas).values({
      id: personaId,
      userId: payload.userId,
    });
  });

  return {
    personaId,
  };
};
