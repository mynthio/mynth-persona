import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger } from "@/lib/logger";
import { extractPersonaMessageText } from "@/lib/utils";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { generateText } from "ai";

export async function generateChatTitle(
  messages: PersonaUIMessage[],
  additionalContext?: string | null
): Promise<string> {
  const messagesAsText = messages
    .map((message) => `${message.role}: ${extractPersonaMessageText(message)}`)
    .join("\n\n");

  const prompt = `You're a helpful assistant that generates titles for role-playing chat conversations.

  Here is the conversation:

  ${messagesAsText}

  ${
    additionalContext
      ? `
  Here is the additional context:

  ${additionalContext}
  `
      : ""
  }

  Generate a title for the conversation. Output the title and a title only as a single and concise sentence, with max 8 words. Do not use any formatting or markdown.
  `;

  const openRouter = getOpenRouter();
  const model = openRouter("mistralai/ministral-3b-2512", {
    models: ["deepseek/deepseek-v3.2"],
  });

  const result = await generateText({
    model,
    prompt,
  });

  logger.debug({ text: result.text }, "Generated chat title");

  return result.text;
}
