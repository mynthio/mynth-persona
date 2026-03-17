import { logger, logAiSdkUsage } from "@/lib/logger";
import { z } from "zod";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateObject } from "ai";
import ms from "ms";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import {
  CHAT_IMAGE_PROMPT_FALLBACK_MODELS,
  CHAT_IMAGE_PROMPT_PRIMARY_MODEL,
} from "@/config/shared/models/chat-image-prompt-models.config";

type CraftImagePromptForSceneImagePayload = {
  personaData: any;
  chatSettings: ChatSettings | null;
  modelName: string;
};

const SCHEMA = z.object({
  prompt: z
    .string()
    .describe(
      "The final prompt for the image generation model. Do not exceed 3000 characters."
    ),
});

export async function craftImagePromptForSceneImage(
  payload: CraftImagePromptForSceneImagePayload
): Promise<{ prompt: string }> {
  const { personaData, chatSettings, modelName } = payload;

  /**
   * Setup logger
   */
  const utilLogger = logger.child({
    meta: {
      who: "utils:craft-image-prompt-for-scene-image",
    },
  });

  // Extract persona details
  const personaName = personaData?.name || "Character";
  const personaGender = personaData?.gender || "Unknown";
  const personaAge = personaData?.age || "Unknown";
  const personaAppearance =
    personaData?.appearance || "No appearance description available";
  const personaSummary = personaData?.summary || "";

  const scenarioContext = chatSettings?.scenario?.scenario_text?.trim() || "";
  const scenarioStyleGuidelines =
    chatSettings?.scenario?.style_guidelines?.trim() || "";

  const system = `
You are an elite prompt engineer for text-to-image models specialized in creating canonical reference images for roleplay characters.

MODEL: ${modelName}

TASK
Generate a detailed image prompt for a full-body character reference image.
This image will be used as a reference for future message images, so identity clarity and outfit consistency matter more than cinematic experimentation.

CHARACTER IDENTITY (must preserve exactly)
- Name: ${personaName}
- Gender: ${personaGender}
- Age: ${personaAge}
- Appearance: ${personaAppearance}
${personaSummary ? `- Summary: ${personaSummary}` : ""}

COMPOSITION REQUIREMENTS
- Full-body shot showing the character from head to toe
- Character should be centered and clearly visible
- Simple, clean background (solid color or subtle gradient preferred)
- Natural standing or relaxed three-quarter pose that clearly shows the full silhouette
- Arms, hands, hair, footwear, accessories, and outfit layers should remain visible unless the character description makes that impossible
- Good lighting that highlights the character's facial features, hairstyle, and clothing construction

STYLE & RENDERING
- Create photorealistic images with natural lighting
- Use precise photographic language: camera angle, lighting mood, color palette
- Professional portrait photography style
- Clean, simple composition focused on the character
- Preserve one coherent canonical outfit; do not mix incompatible garments just to include every detail from the description

BACKGROUND
- Keep background simple and non-distracting
- Solid colors, subtle gradients, or minimal environmental elements
- Background should complement the character without competing for attention

SAFETY
- All content must be SFW (Safe For Work)
- No nudity, sexual content, or explicit imagery
- Tasteful, appropriate depictions only
- If character is under 18, ensure completely appropriate content

OUTPUT FORMAT
Return ONLY the final prompt paragraph, no markup, no section labels.
Maximum 170 words.
`.trim();

  const prompt = `
${scenarioContext ? `Scenario context: ${scenarioContext}\n\n` : ""}${
    scenarioStyleGuidelines
      ? `Scenario style guidance: ${scenarioStyleGuidelines}\n\n`
      : ""
  }Generate a full-body reference image of ${personaName}.

Requirements:
- Full-body shot, head to toe
- Simple, clean background (solid color or subtle)
- Natural standing or relaxed three-quarter pose
- Clear view of character's appearance, clothing, and features
- Professional photography style with good lighting
- Prioritize a single cohesive canonical outfit and visible accessories that will work well as future reference input

Character details: ${personaAppearance}

${personaSummary ? `Character summary: ${personaSummary}` : ""}
`.trim();

  utilLogger.debug({
    meta: {
      what: "scene-image-prompt-inputs",
    },
    data: {
      system: system.slice(0, 200),
      prompt: prompt.slice(0, 200),
      personaName,
    },
  });

  const openRouter = getOpenRouter();
  const model = openRouter(CHAT_IMAGE_PROMPT_PRIMARY_MODEL, {
    models: CHAT_IMAGE_PROMPT_FALLBACK_MODELS,
    usage: {
      include: true,
    },
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
      what: "scene-image-prompt-generated",
    },
    data: {
      object: result.object,
      model: result.response.modelId,
    },
  });

  logAiSdkUsage(result, {
    component: "image_generation:scene:prompt:complete",
    useCase: "scene_image_prompt_crafting",
  });

  return result.object;
}
