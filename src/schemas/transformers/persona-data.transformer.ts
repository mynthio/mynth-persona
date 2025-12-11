import { personaDataSchema, type PersonaData } from "@/schemas/backend";
import type { CreatorPersonaGenerate } from "@/schemas/shared/creator/persona-generate.schema";
import { snakeCase } from "case-anything";

/**
 * Transform Creator persona generation output to internal PersonaData.
 * - Ensures age is a string
 * - Normalizes extension keys to snake_case
 * - Validates the result against personaDataSchema
 */
function formatExtensionKeys(
  extensions?: Record<string, string> | null
): Record<string, string> | undefined {
  if (!extensions) return undefined;

  const formatted: Record<string, string> = {};
  for (const [key, value] of Object.entries(extensions)) {
    formatted[snakeCase(key)] = value;
  }
  return formatted;
}

export function transformCreatorPersonaGenerateToPersonaData(
  input: CreatorPersonaGenerate
): PersonaData {
  return personaDataSchema.parse({
    name: input.name,
    age: String(input.age),
    gender: input.gender,
    summary: input.summary,
    appearance: input.appearance,
    personality: input.personality,
    background: input.background,
    speakingStyle: input.speakingStyle ?? undefined,
    occupation: input.occupation ?? undefined,
    extensions: formatExtensionKeys(input.extensions ?? undefined),
  });
}
