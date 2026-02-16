import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger } from "@/lib/logger";

const dialoguePartsSchema = z.object({
  parts: z.array(
    z.object({
      text: z.string(),
      type: z.enum(["narrative", "character"]),
    }),
  ),
});

export type DialoguePart = z.infer<typeof dialoguePartsSchema>["parts"][number];

/**
 * Uses an LLM to split a roleplay message into ordered narrative and character dialogue segments.
 *
 * Responsibilities:
 * 1. Split message into narrative and character dialogue segments (ordered)
 * 2. Convert narrative/action parts from 1st person to 3rd person using character name
 * 3. Add ElevenLabs V3 modifiers where appropriate (e.g., [laughs], [sighs], [whispers])
 * 4. Preserve character dialogue as-is (only add modifiers)
 * 5. Detect dialogue vs narration based on common roleplay formatting
 */
export async function extractDialogueParts(
  messageText: string,
  characterName: string,
): Promise<DialoguePart[]> {
  const openRouter = getOpenRouter();
  const modelName = "mistralai/mistral-small-3.2-24b-instruct";

  const startTime = Date.now();

  const result = await generateText({
    model: openRouter(modelName),
    output: Output.object({
      schema: dialoguePartsSchema,
    }),
    system: `You are a roleplay text processor for ElevenLabs v3 TTS.

Input: Message from character "${characterName}" in standard roleplay format.

Task:
- Split into alternating segments: "narrative" (descriptions, actions in *...*, thoughts, unquoted text) or "character" (spoken dialogue in "..." or direct speech).
- Convert all narrative to 3rd person using a short form of the character name (prefer first name or nickname for natural flow; e.g., "Elara" instead of "Elara Voss").
- Keep dialogue wording unchanged.
- Add natural v3 audio tags sparingly where they enhance emotion or sensuality. Common tags: [whispers], [laughs], [sighs], [gasps], [moans], [moans softly], [groans], [chuckles], [heavy breathing], [breathy], [seductive], [low], [raspy].
- Remove all formatting markers (*, ", etc.).

Output ONLY a JSON array of objects with "type" ("narrative" or "character") and "text" (processed string). Preserve order and all content. Keep segments short and natural for TTS.

If entire message is dialogue, use one character segment. If unsure, treat as narrative.`,
    prompt: messageText,
  });

  const duration = Date.now() - startTime;
  logger.debug(
    {
      model: modelName,
      durationMs: duration,
      textLength: messageText.length,
      partsCount: result.output.parts.length,
    },
    "Text extraction duration",
  );

  return result.output.parts;
}
