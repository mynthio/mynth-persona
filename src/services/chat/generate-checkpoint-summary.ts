import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger } from "@/lib/logger";
import { extractPersonaMessageText } from "@/lib/utils";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { generateText } from "ai";

export async function generateCheckpointSummary(args: {
  messagesSinceLastCheckpoint: PersonaUIMessage[];
  lastCheckpointMessage?: PersonaUIMessage;
  userName: string;
  personaName: string;
}): Promise<string> {
  const {
    messagesSinceLastCheckpoint,
    lastCheckpointMessage,
    userName,
    personaName,
  } = args;

  const messagesAsText = messagesSinceLastCheckpoint
    .map(
      (message) => `[${message.role}]: ${extractPersonaMessageText(message)}`
    )
    .join("\n\n");

  const previousSummary = lastCheckpointMessage?.metadata?.checkpoint?.content;

  const system = `Extract the current roleplay state. Be extremely concise but capture emotional dynamics.

FORMAT:
Location: [current scene location and atmosphere]
Characters: [who is present and their current demeanor]
${personaName}: [emotional state, appearance, attitude toward ${userName}, current goal]
${userName}: [emotional state, stance, what they seem to want]
Relationship: [current dynamic - trust level, tension, affection, conflict, intimacy]
Recent: [3-5 key events as brief phrases]
Open threads: [unresolved situations, unanswered questions, promises made]
Must remember: [names, objects, facts critical to story continuity]

RULES:
- Maximum 250 words total
- Use phrases, not full sentences
- Capture emotional subtext, not just surface events
- Prioritize information affecting character behavior
- Include any physical changes (injuries, clothing, location changes)
- Only include categories with actual content`;

  let prompt = "";

  if (previousSummary) {
    prompt += `Previous checkpoint:
${previousSummary}

Update with new developments only. Don't repeat unchanged information.

`;
  }

  prompt += `Messages to summarize:
${messagesAsText}`;

  const openRouter = getOpenRouter();
  const model = openRouter("deepseek/deepseek-v3.2", {
    models: ["google/gemini-2.5-flash"],
  });

  const result = await generateText({
    model,
    system,
    prompt,
  });

  logger.debug({ text: result.text }, "Generated checkpoint summary");

  return result.text;
}
