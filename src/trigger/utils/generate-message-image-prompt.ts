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
};

const SCHEMA = z.object({
  prompt: z
    .string()
    .describe(
      "The final prompt for the image generation model. Do not exceed 3000 characters."
    ),
});

/**
 * Determines how many messages to use for context based on message length
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
  const { messages, targetMessageId, personaData, chatSettings } = payload;

  /**
   * Setup logger
   */
  const utilLogger = logger.child({
    meta: {
      who: "utils:craft-image-prompt-for-message",
    },
  });

  // Get context messages based on length
  const contextMessages = getContextMessages(messages, targetMessageId);
  const targetMessage = contextMessages[contextMessages.length - 1];

  // Build conversation context
  const conversationContext = contextMessages
    .map((msg, idx) => {
      const text = extractPersonaMessageText(msg);
      const role = msg.role === "user" ? "User" : "Character";
      const isTarget = msg.id === targetMessageId;
      return `
### ${role}

${text}`;
    })
    .join("\n\n");

  // Extract persona basics (name only, to avoid over-describing appearance which can introduce noise)
  const personaName = personaData?.name || "Character";

  // Extract scenario context if available
  const scenarioContext = chatSettings?.scenario?.scenario_text || "";

  const system = `
You are a prompt engineer for Gemini 2.5 Flash Image model (Nano Banana), generating concise prompts for consistent character images in RP chats. Analyze the last 2-4 messages, focusing only on the main character's actions, pose, expression, outfit, and surroundings from the latest message. Ignore third-parties; center solely on the main character.
Guidelines:

Start with: "Using the provided full-body reference image of the character,"
Preserve base physical properties (facial features, hair, body proportions, skin tone).
Do NOT add or change the visual style. Preserve the reference image's existing style exactly (e.g., if the reference is illustrated, keep it illustrated; if it's photographic, keep it photographic).
Do NOT include style/rendering keywords like: photorealistic, realistic, anime, cinematic, 3D render, cartoon, watercolor, oil painting, etc.
Always specify a pose and outfit, even if unchanged (default to neutral standing and reference outfit if unspecified).
Describe changes/new elements briefly: pose/action, expression, outfit mods, lighting, background.
Single narrative paragraph, hyper-specific. Under 100 words.
Output ONLY the prompt—no extras.

Examples:

Chat: User: "You enter the forest." Char: "I step cautiously, lantern up."
Output: "Using the provided full-body reference image of the character, pose as stepping cautiously with arm raised holding lantern, alert expression, wearing explorer outfit. Dark misty forest background at night, lantern glow. Preserve facial features, hair, body, skin tone. Do not add style; keep the reference image's style."
Chat: Prev: "Battle on." User: "Swing sword." Char: "Leap back, panting in torn armor."
Output: "Using the provided full-body reference image of the character, pose leaping back panting, exhausted expression, in torn armor outfit. Smoky battlefield background. Keep identical facial structure, hair, proportions, skin tone. Do not add style; keep the reference image's style."
`.trim();

  const prompt = `
Last messages from the role-playing chat:

${conversationContext}

Generate a prompt for Gemini 2.5 Flash to visualize the scene from the last message, using the full-body reference image of the character.
`.trim();

  utilLogger.debug({
    meta: {
      what: "message-image-prompt-inputs",
    },
    data: {
      system: system.slice(0, 200),
      prompt: prompt.slice(0, 200),
      contextMessagesCount: contextMessages.length,
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

  // Get context messages based on length
  const contextMessages = getContextMessages(messages, targetMessageId);
  const targetMessage = contextMessages[contextMessages.length - 1];

  // Build conversation context
  const conversationContext = contextMessages
    .map((msg, idx) => {
      const text = extractPersonaMessageText(msg);
      const role = msg.role === "user" ? "User" : "Character";
      const isTarget = msg.id === targetMessageId;
      return `
### ${role}

${text}`;
    })
    .join("\n\n");

  // Extract persona appearance and name
  const personaName = personaData?.name || "Character";
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
