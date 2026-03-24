import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger } from "@/lib/logger";
import { extractPersonaMessageText } from "@/lib/utils";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { generateText } from "ai";

function sanitizeTitle(raw: string): string {
  return raw.replace(/^[*\s"'`"'`]+|[*\s"'`"'`]+$/g, "").trim();
}

export async function generateChatTitle(
  messages: PersonaUIMessage[],
  additionalContext?: string | null
): Promise<string> {
  const messagesAsText = messages
    .map((message) => `${message.role}: ${extractPersonaMessageText(message)}`)
    .join("\n\n");

  const prompt = `Generate a concise title (max 8 words) for this role-play conversation. Output ONLY the plain title — no markdown, no quotes, no formatting.

Conversation:
${messagesAsText}${
    additionalContext
      ? `

Context: ${additionalContext}`
      : ""
  }`;

  const openRouter = getOpenRouter();
  const model = openRouter("bytedance-seed/seed-2.0-mini", {
    models: ["deepseek/deepseek-v3.2"],
  });

  const result = await generateText({
    model,
    prompt,
  });

  const title = sanitizeTitle(result.text);

  logger.debug({ text: title }, "Generated chat title");

  return title;
}
