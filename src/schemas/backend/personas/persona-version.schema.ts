import { z } from "zod";

/**
 * Roleplay Data V2 - Structured variant
 * Contains explicit fields for name, age, gender, and key character attributes
 */
export const roleplayDataV2Structured = z.object({
  name: z.string().describe("Character's name"),
  age: z
    .string()
    .describe("Character's age (e.g., '25', 'mid-20s', 'ancient')"),
  gender: z.string().describe("Character's gender"),
  appearance: z
    .string()
    .describe(
      "Comma-separated list of physical attributes: body type, skin tone, hair color/style, eye color, facial features, clothing style, posture, distinguishing marks, and other visual characteristics"
    ),
  speech: z
    .string()
    .describe(
      "Comma-separated list of speech characteristics: accent/dialect, vocabulary level, speech patterns, verbal tics, tone qualities, speaking pace, catchphrases, and other vocal traits"
    ),
  background: z
    .string()
    .describe(
      "Comma-separated list of background elements: occupation, education, key relationships, formative events, upbringing, past experiences, current situation, and other biographical details"
    ),
  personality: z
    .string()
    .describe(
      "Comma-separated list of personality traits and behaviors: core traits, temperament, emotional patterns, quirks, habits, values, fears, coping mechanisms, social tendencies, and other behavioral characteristics"
    ),
  quirks: z
    .string()
    .describe(
      "Comma-separated list of habits and quirks: mannerisms, routines, nervous habits, personal rituals, idiosyncrasies"
    ),
  relationships: z
    .string()
    .describe(
      "Comma-separated list of key relationships: partners, family members, close friends, mentors, rivals, and their nature"
    ),
  goals: z
    .string()
    .describe(
      "Comma-separated list of motivations and goals: life ambitions, current objectives, desires, aspirations"
    ),
});

export type RoleplayDataV2Structured = z.infer<typeof roleplayDataV2Structured>;

/**
 * Roleplay Data V2 - Natural language variant
 * A flowing 3rd person description without name/gender/age (those are handled separately)
 */
export const roleplayDataV2Natural = z
  .string()
  .describe(
    "Third-person natural language description covering appearance, speech patterns, background, and personality. Written as flowing prose without mentioning name, gender, or age."
  );

export type RoleplayDataV2Natural = z.infer<typeof roleplayDataV2Natural>;

/**
 * Roleplay Data V2 - Combined container
 */
export const roleplayDataV2 = z.object({
  structured: roleplayDataV2Structured,
  natural: roleplayDataV2Natural,
});

export type RoleplayDataV2 = z.infer<typeof roleplayDataV2>;

/**
 * Chat Settings User Persona
 * Contains both legacy fields (v1) and the new v2 property
 */
export const personaVersionRoleplayData = z.object({
  // Legacy v1 fields (kept for backwards compatibility)
  name: z.string(),
  age: z.string(),
  gender: z.string(), // TODO: Use enum
  appearance: z.string(),
  personality: z.string().nullable().optional(),
  background: z.string().nullable().optional(),
  interests: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  motivations: z.string().nullable().optional(),

  // V2 roleplay data (optional for backwards compatibility)
  v2: roleplayDataV2.optional(),
});

export type PersonaVersionRoleplayData = z.infer<
  typeof personaVersionRoleplayData
>;
