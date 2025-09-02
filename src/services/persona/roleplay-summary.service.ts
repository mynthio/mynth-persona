import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateObject } from "ai";
import { z } from "zod/v4";
import { logAiSdkUsage } from "@/lib/logger";

const ROLEPLAY_SUMMARY_MODEL_ID = "google/gemini-2.5-flash-lite" as const;

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
