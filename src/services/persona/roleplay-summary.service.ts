import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateObject } from "ai";
import { z } from "zod";
import { logAiSdkUsage } from "@/lib/logger";
import {
  roleplayDataV2Structured,
  type RoleplayDataV2,
} from "@/schemas/backend/personas/persona-version.schema";

const ROLEPLAY_SUMMARY_MODEL_ID = "google/gemini-2.5-flash-lite" as const;

// ============================================================================
// V1 Schema (Legacy)
// ============================================================================

export const roleplaySummarySchema = z.object({
  appearance: z
    .string()
    .describe(
      "Single comma-separated string of visual descriptors (e.g., slender athletic build, upright posture, oval face, high cheekbones)—include body type, skin tone/ethnicity, hair color/style, eyes, notable features, clothing/style; no articles/prepositions/sentences/trailing period; under 100 words."
    ),
  personality: z
    .string()
    .describe(
      "Concise description of traits, speaking style, quirks, and behaviors; semicolon-separated fragments; under 50 tokens."
    ),
  background: z
    .string()
    .describe(
      "Key history, relationships, and formative events; 1-2 short sentences or fragments; under 50 tokens."
    ),
  interests: z
    .string()
    .optional()
    .describe(
      "Optional: Hobbies, pursuits, or passions if present in data; comma-separated list; omit if not relevant; under 30 tokens."
    ),
  skills: z
    .string()
    .optional()
    .describe(
      "Optional: Abilities and knowledge domains if present; comma-separated list; omit if not relevant; under 30 tokens."
    ),
  motivations: z
    .string()
    .optional()
    .describe(
      "Optional: Goals, aspirations, motivations, and occupation if present; 1 short sentence or fragments; omit if not relevant; under 40 tokens."
    ),
});

export type RoleplaySummary = z.infer<typeof roleplaySummarySchema>;

// ============================================================================
// V2 Schema
// ============================================================================

/**
 * V2 Roleplay Summary Schema for structured output generation.
 * Generates both structured data and natural language description in a single call.
 */
export const roleplaySummaryV2Schema = z.object({
  structured: roleplayDataV2Structured.describe(
    "Structured character data with explicit fields"
  ),
  natural: z
    .string()
    .describe(
      "Third-person natural language description of the character. Written as flowing prose covering appearance, speech patterns, background, and personality. Do NOT include name, gender, or age - those are handled separately. Example: 'She is an accountant with long black hair and a confident figure. She speaks with a slight southern drawl, often using formal business terminology. Growing up in a small town, she worked her way through college. She tends to be analytical and reserved, though she has a dry sense of humor.'"
    ),
});

export type RoleplaySummaryV2 = z.infer<typeof roleplaySummaryV2Schema>;

const ROLEPLAY_SUMMARY_V2_SYSTEM_PROMPT = `You are a character analyst creating roleplay data for an AI companion app.

TASK: Generate both structured character data AND a natural language description from the provided character information.

RULES:
- Extract ONLY from provided data; never invent or assume details
- Be detailed and comprehensive - do NOT limit to 3-5 items
- Use plain text, no emojis or special formatting

FOR STRUCTURED OUTPUT (use comma-separated lists):
- name: Character's exact name from the data
- age: Character's age (e.g., "25", "mid-20s", "ancient")
- gender: Character's gender as stated
- appearance: Comma-separated list of physical attributes (body type, skin tone, hair color/style, eye color, facial features, clothing style, posture, distinguishing marks, etc.). Be detailed and thorough.
- speech: Comma-separated list of speech characteristics (accent/dialect, vocabulary level, speech patterns, verbal tics, tone qualities, speaking pace, catchphrases, etc.). Be detailed and thorough.
- background: Comma-separated list of background elements (occupation, education, key relationships, formative events, upbringing, past experiences, current situation, etc.). Be detailed and thorough.
- personality: Comma-separated list of personality traits and behaviors (core traits, temperament, emotional patterns, values, fears, coping mechanisms, social tendencies, etc.). Be detailed and thorough.
- quirks: Comma-separated list of habits and quirks (mannerisms, routines, nervous habits, personal rituals, idiosyncrasies). Keep compact.
- relationships: Comma-separated list of key relationships (partners, family members, close friends, mentors, rivals, and their nature). Keep compact.
- goals: Comma-separated list of motivations and goals (life ambitions, current objectives, desires, aspirations). Keep compact.

FOR NATURAL LANGUAGE OUTPUT:
- Write in THIRD PERSON (She/He/They)
- Do NOT include name, gender, or explicit age
- Cover: appearance, speech patterns, background, personality
- Write as flowing prose, not bullet points`;

// ============================================================================
// V1 Generation (Legacy)
// ============================================================================

export async function generateRoleplaySummary(data: unknown): Promise<{
  summary: RoleplaySummary;
  modelId: string;
}> {
  const openrouter = getOpenRouter();
  const model = openrouter(ROLEPLAY_SUMMARY_MODEL_ID, {
    models: ["mistralai/mistral-small-3.2-24b-instruct"],
  });

  const response = await generateObject({
    model,
    system:
      "Generate ultra-concise, token-efficient character details for role-play. Extract only from provided data; never add/invent. Omit age/name/gender. Use plain text, no fluff/emojis/formatting.",
    prompt: `Character: ${JSON.stringify(data)}`,
    schema: roleplaySummarySchema,
  });

  // Log usage internally
  logAiSdkUsage(response, {
    component: "generation:text:complete",
    useCase: "roleplay_summary_generation",
  });

  return {
    summary: response.object,
    modelId: response.response.modelId,
  };
}

// ============================================================================
// V2 Generation
// ============================================================================

export async function generateRoleplaySummaryV2(data: unknown): Promise<{
  summary: RoleplaySummaryV2;
  modelId: string;
}> {
  const openrouter = getOpenRouter();
  const model = openrouter(ROLEPLAY_SUMMARY_MODEL_ID, {
    models: ["mistralai/mistral-small-3.2-24b-instruct"],
  });

  const response = await generateObject({
    model,
    system: ROLEPLAY_SUMMARY_V2_SYSTEM_PROMPT,
    prompt: `Character data:\n${JSON.stringify(data, null, 2)}`,
    schema: roleplaySummaryV2Schema,
  });

  // Log usage internally
  logAiSdkUsage(response, {
    component: "generation:text:complete",
    useCase: "roleplay_summary_v2_generation",
  });

  return {
    summary: response.object,
    modelId: response.response.modelId,
  };
}

/**
 * Convert V2 summary to the RoleplayDataV2 format used in the database
 */
export function convertV2SummaryToRoleplayData(
  summary: RoleplaySummaryV2
): RoleplayDataV2 {
  return {
    structured: summary.structured,
    natural: summary.natural,
  };
}
