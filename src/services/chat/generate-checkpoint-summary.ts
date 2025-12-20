import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger } from "@/lib/logger";
import { extractPersonaMessageText } from "@/lib/utils";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { generateText } from "ai";

export async function generateCheckpointSummary(args: {
  messagesTillLastCheckpoint: PersonaUIMessage[];
  lastCheckpointMessage?: PersonaUIMessage;
  userName: string;
  personaName: string;
}): Promise<string> {
  const {
    messagesTillLastCheckpoint,
    lastCheckpointMessage,
    userName,
    personaName,
  } = args;

  const messagesAsText = messagesTillLastCheckpoint
    .map(
      (message) => `[${message.role}]: ${extractPersonaMessageText(message)}`
    )
    .join("\n\n");

  const previousSummary = lastCheckpointMessage
    ? extractPersonaMessageText(lastCheckpointMessage)
    : null;

  const system = `Extract the current roleplay state as structured data. Be extremely concise.

FORMAT:
Location: [current scene location]
Characters present: [who is in the scene]
${personaName} state: [emotional state, goals, clothes, outfit, body, attitude toward ${userName}]
${userName} state: [if apparent from messages]
Recent events: [2-3 key things that happened, as brief phrases]
Open threads: [unresolved conflicts, promises, questions]
Important details: [names, objects, facts that must not be forgotten]

RULES:
- Maximum 200 words total
- Use phrases, not sentences
- No narrative prose
- Only include categories with actual content
- Prioritize information needed for story continuity`;

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
