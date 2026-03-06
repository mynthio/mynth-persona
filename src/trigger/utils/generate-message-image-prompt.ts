import { logger, logAiSdkUsage } from "@/lib/logger";
import { z } from "zod";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateObject } from "ai";
import ms from "ms";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import { extractPersonaMessageText } from "@/lib/utils";

type CraftImagePromptForMessagePayload = {
  messages: PersonaUIMessage[];
  targetMessageId: string;
  personaData: any;
  chatSettings: ChatSettings | null;
  imageModelDisplayName?: string;
};

const SCHEMA = z.object({
  prompt: z
    .string()
    .describe(
      "The final prompt for the image generation model. Do not exceed 3000 characters."
    ),
});

/**
 * Returns a focused context window ending at the target message.
 */
function getContextMessages(
  messages: PersonaUIMessage[],
  targetMessageId: string
): PersonaUIMessage[] {
  const targetIndex = messages.findIndex((m) => m.id === targetMessageId);

  if (targetIndex === -1) {
    // If target not found, use last 4 messages
    return messages.slice(-4);
  }

  // Get messages up to and including target
  const messagesUpToTarget = messages.slice(0, targetIndex + 1);

  // Use last 4 messages for context
  return messagesUpToTarget.slice(-4);
}

/**
 * Character mode: Uses reference image for consistent character appearance
 */
export async function craftImagePromptForMessageCharacterMode(
  payload: CraftImagePromptForMessagePayload
): Promise<{ prompt: string }> {
  const {
    messages,
    targetMessageId,
    chatSettings,
    imageModelDisplayName,
  } = payload;

  /**
   * Setup logger
   */
  const utilLogger = logger.child({
    meta: {
      who: "utils:craft-image-prompt-for-message",
    },
  });

  // Get context messages ending at the target message
  const contextMessages = getContextMessages(messages, targetMessageId);

  // Build conversation context
  const conversationContext = contextMessages
    .map((msg) => {
      const text = extractPersonaMessageText(msg);
      const role = msg.role === "user" ? "User" : "Character";
      const targetLabel =
        msg.id === targetMessageId ? " (TARGET MESSAGE)" : "";

      return `
### ${role}${targetLabel}

${text}`;
    })
    .join("\n\n");

  const scenarioContext = chatSettings?.scenario?.scenario_text?.trim();
  const scenarioStyleGuidelines =
    chatSettings?.scenario?.style_guidelines?.trim();

  const system = `
You are an image-prompt engineer for roleplay chats.
Target image model: ${imageModelDisplayName || "the selected model"}.
Write a single paragraph prompt for character mode, where a full-body reference image is provided.

Rules:
- Start with exactly: "Using the provided full-body reference image of the character,"
- Preserve core identity from the reference image: face, hair, body proportions, skin tone.
- Keep the reference image's existing visual style; do not force style shifts.
- Always specify a clear pose or action.
- Facial expression should be subtle/neutral by default; only use strong emotion if the target message clearly demands it.
- Do not copy reference-image pose or expression by default.
- Outfit handling:
  - If the target message clearly specifies clothing, follow it.
  - If clothing is not explicit, do not invent new outfit details.
  - For bikini/swimwear requests, describe a coherent swimwear outfit and avoid contradictory layering (for example, bikini over regular clothes).
- Include one short, high-level background/environment line that is compatible with the scene.
- Focus on the main character from the target message; avoid adding unrelated subjects.
- Keep it concise and specific, max 110 words.
- Output only the final prompt paragraph.
`.trim();

  const prompt = `
${scenarioContext ? `Scenario context: ${scenarioContext}\n\n` : ""}${
    scenarioStyleGuidelines
      ? `Scenario style guidance: ${scenarioStyleGuidelines}\n\n`
      : ""
  }Last messages from the role-playing chat:

${conversationContext}

Generate the final prompt for character-mode image generation from the target message.
`.trim();

  utilLogger.debug({
    meta: {
      what: "message-image-prompt-inputs",
    },
    data: {
      system: system.slice(0, 200),
      prompt: prompt.slice(0, 200),
      contextMessagesCount: contextMessages.length,
      imageModelDisplayName: imageModelDisplayName || null,
      hasScenarioContext: Boolean(scenarioContext),
      hasScenarioStyleGuidelines: Boolean(scenarioStyleGuidelines),
    },
  });

  const openRouter = getOpenRouter();
  const model = openRouter("openai/gpt-5-mini", {
    models: ["moonshotai/kimi-k2-0905"],
  });

  const result = await generateObject({
    model,
    prompt,
    system,
    schema: SCHEMA,
    abortSignal: AbortSignal.timeout(ms("5m")),
  }).catch((error) => {
    throw error;
  });

  utilLogger.debug({
    meta: {
      what: "message-image-prompt-generated",
    },
    data: {
      object: result.object,
      model: result.response.modelId,
    },
  });

  logAiSdkUsage(result, {
    component: "image_generation:message:prompt:complete",
    useCase: "message_image_prompt_crafting",
  });

  return result.object;
}

/**
 * Creative mode: Includes character appearance in prompt (no reference image)
 */
export async function craftImagePromptForMessageCreativeMode(
  payload: CraftImagePromptForMessagePayload
): Promise<{ prompt: string }> {
  const { messages, targetMessageId, personaData, chatSettings } = payload;

  /**
   * Setup logger
   */
  const utilLogger = logger.child({
    meta: {
      who: "utils:craft-image-prompt-for-message-creative",
    },
  });

  // Get context messages ending at the target message
  const contextMessages = getContextMessages(messages, targetMessageId);

  // Build conversation context
  const conversationContext = contextMessages
    .map((msg) => {
      const text = extractPersonaMessageText(msg);
      const role = msg.role === "user" ? "User" : "Character";
      return `
### ${role}

${text}`;
    })
    .join("\n\n");

  const personaAppearance = personaData?.appearance || "";

  // Extract scenario context if available
  const scenarioContext = chatSettings?.scenario?.scenario_text || "";

  const system = `
You are a prompt engineer for image generation models, creating vivid scene prompts for role-playing chat visualizations. Analyze the last 2-4 messages, focusing on the main character's appearance, actions/pose, expression, outfit, and the environment implied by the latest message.

Guidelines:

Incorporate the provided character appearance description.
Produce a cohesive SCENE: the main character is the clear focal point, while also depicting meaningful background, lighting, mood, and props.
When natural — and especially in creative mode — add complementary elements (e.g., other people, creatures, vehicles, weather) that enrich the scene while keeping the main character primary.
Always specify a pose and outfit, even if unchanged (default to neutral standing if unspecified).
Single narrative paragraph, hyper-specific, photorealistic. Use photography/cinematography terms (camera angle, lens, lighting, composition). Under 120 words.
Output ONLY the prompt—no extras.
`.trim();

  const prompt = `
Character appearance: ${personaAppearance}

${
  scenarioContext ? `Scenario context: ${scenarioContext}\n\n` : ""
}Last messages from the role-playing chat:

${conversationContext}

Generate a prompt to visualize the scene from the last message, including the character's full appearance and the described action/setting.
`.trim();

  utilLogger.debug({
    meta: {
      what: "message-image-prompt-inputs-creative",
    },
    data: {
      system: system.slice(0, 200),
      prompt: prompt.slice(0, 200),
      contextMessagesCount: contextMessages.length,
      hasAppearance: !!personaAppearance,
    },
  });

  const openRouter = getOpenRouter();
  const model = openRouter("openai/gpt-5-mini", {
    models: ["moonshotai/kimi-k2-0905"],
  });

  const result = await generateObject({
    model,
    prompt,
    system,
    schema: SCHEMA,
    abortSignal: AbortSignal.timeout(ms("5m")),
  }).catch((error) => {
    throw error;
  });

  utilLogger.debug({
    meta: {
      what: "message-image-prompt-generated-creative",
    },
    data: {
      object: result.object,
      model: result.response.modelId,
    },
  });

  logAiSdkUsage(result, {
    component: "image_generation:message:prompt:creative",
    useCase: "message_image_prompt_crafting_creative",
  });

  return result.object;
}
