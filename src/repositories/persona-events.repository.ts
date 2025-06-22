import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { Persona } from "@/types/persona.type";
import { nanoid } from "nanoid";

export const createPersonaEvent = async (persona: Omit<Persona, "id">) => {
  const id = `prs_${nanoid()}`;

  return db
    .insert(personas)
    .values({
      id,
      ...persona,
    })
    .returning();
};
