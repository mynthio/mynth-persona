"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { personaDataSchema } from "@/schemas/backend/persona.schema";
import { PersonaData } from "@/schemas";
import { createPersona } from "@/services/persona/create-persona";
import { snakeCase } from "case-anything";

export const createCustomPersonaAction = async (data: PersonaData) => {
  const { userId } = await auth.protect();

  const parsed = personaDataSchema.parse(data);

  // Normalize extension keys
  if (parsed.extensions) {
    const normalized: Record<string, string> = {};
    const keys = Object.keys(parsed.extensions)
      .map((k) => snakeCase(k, { keepSpecialCharacters: false }))
      .sort();

    for (const key of keys) {
      const originalKey = Object.keys(parsed.extensions).find(
        (k) => snakeCase(k, { keepSpecialCharacters: false }) === key,
      );
      if (originalKey && parsed.extensions[originalKey]) {
        normalized[key] = parsed.extensions[originalKey];
      }
    }
    parsed.extensions = normalized;
  }

  const { personaId, versionId } = await createPersona({
    userId,
    aiModel: "custom",
    prompt: "",
    title: parsed.name,
    data: parsed,
    isCustom: true,
  });

  return { personaId, versionId };
};
