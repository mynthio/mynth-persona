import { PersonaData } from "@/types/persona.type";
import { logger, logAiSdkUsage } from "@/lib/logger";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { z } from "zod";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateObject } from "ai";
import ms from "ms";
import {
  getDefaultPromptDefinitionForMode,
  getDefaultUserPromptDefinitionForMode,
} from "@/lib/prompts/registry";

type CraftImagePromptForPersonaPayload = {
  personaData: PersonaData;
  modelName: string;
  options: {
    style: ImageStyle;
    shotType: ShotType;
    nsfw?: boolean;
    userNote?: string;
  };
};

const SCHEMA_DEFAULT = z.object({
  prompt: z
    .string()
    .describe(
      "The final prompt for the image generation model. Do not exceed 3000 characters."
    ),
});

const SCHEMA_WITH_NEGATIVE_PROMPT = z.object({
  prompt: z
    .string()
    .describe(
      "The final prompt for the image generation model. Do not exceed 3000 characters."
    ),
  negativePrompt: z
    .string()
    .optional()
    .describe(
      "The negative prompt for the image generation model. Only used if the model supports it."
    ),
});

export async function craftImagePromptForPersona(
  payload: CraftImagePromptForPersonaPayload
): Promise<{ prompt: string; negativePrompt?: string }> {
  const personaData = payload.personaData;
  const { modelName } = payload;
  const { style, shotType, nsfw = false, userNote = "" } = payload.options;

  /**
   * Setup logger
   */
  const utilLogger = logger.child({
    meta: {
      who: "utils:craft-image-prompt-for-persona",
    },
  });

  // Fetch system prompt from the new prompts registry (image -> persona)
  let system = getDefaultPromptDefinitionForMode("image", "persona").render({
    modelName,
    nsfw,
  });

  if (modelName === "Bismuth Illustrious Mix v5.0") {
    system = `
You are a prompt engineer for the Bismuth Illustrious Mix SDXL model, optimizing character portrait prompts for a persona creation app.

## Input Format
You'll receive structured persona data:
- Character: name, age, gender
- Summary: brief character description
- Appearance: physical details
- Style: (realistic | anime | cinematic | auto)
- Shot: (portrait | full-body)
- Content: NSFW status
- User note: optional creative direction

## Core Principles

**Single Character Only**: Always generate prompts for exactly one character. Never add additional people, companions, or crowd elements.

**Quality Over Fidelity**: Prioritize a polished, cohesive image over cramming every appearance detail. Extract the 3-5 most defining visual traits rather than listing everything. A clean prompt with essential features beats a bloated prompt that confuses the model.

**Face Visibility**: The character's face must always be visible and well-rendered. Place facial details (eye color, expression) early in the prompt with "detailed face, anatomically correct".

## Prompt Structure

Build prompts in this order (most important first):
1. Subject tag: "1girl", "1boy", or "1other" based on gender
2. Quality tags: "masterpiece, best quality, absurdres"
3. Core facial features: eye color, hair color/style, expression
4. Key distinguishing traits: 2-3 most iconic appearance elements
5. Pose/shot type: based on the Shot field
6. Outfit: simplified if complex, focus on vibe not exhaustive detail
7. Environment: infer from summary/context, or use abstract/gradient backgrounds
8. Lighting/mood: match the style and character personality

## Style Adaptation
- **Realistic**: Use photographic terms (soft lighting, rim light, shallow depth of field). Lean semi-realistic for Bismuth compatibility.
- **Anime**: Full Danbooru tag style, anime-specific quality tags
- **Cinematic**: Dramatic lighting, film grain, movie poster composition
- **Auto**: Blend based on character context

## Negative Prompt
Keep minimal and focused: "lowres, worst quality, bad anatomy, bad hands, extra digits, deformed, blurry, watermark". Only add specifics if the positive prompt risks triggering common issues.

## Output
Generate a positive prompt and negative prompt. Do not explain or add commentary—just the prompts.
    `.trim();
  }

  // Fetch user-level prompt (first non-system default) and render it
  const prompt = getDefaultUserPromptDefinitionForMode(
    "image",
    "persona"
  ).render({
    persona: personaData,
    style,
    shotType,
    nsfw,
    userNote,
  });

  utilLogger.debug({
    meta: {
      what: "image-prompt-system-prompt-created",
    },
    data: {
      system,
      prompt,
    },
  });

  const openRouter = getOpenRouter();

  // Determine model set based on image model
  const isBismuth = modelName === "Bismuth Illustrious Mix v5.0";

  // Model sets for shuffling
  const bismuthModels = [
    "deepseek/deepseek-chat-v3-0324",
    "moonshotai/kimi-k2-0905",
  ] as const;

  const defaultModels = ["openai/gpt-5-mini", "x-ai/grok-4-fast"] as const;

  // Randomly select primary model and use the other as fallback
  const modelSet = isBismuth ? bismuthModels : defaultModels;
  const randomIndex = Math.random() < 0.5 ? 0 : 1;
  const primaryModel = modelSet[randomIndex];
  const fallbackModel = modelSet[1 - randomIndex];

  const model = openRouter(primaryModel, {
    models: [fallbackModel],
    usage: {
      include: true,
    },
  });

  const schema = isBismuth ? SCHEMA_WITH_NEGATIVE_PROMPT : SCHEMA_DEFAULT;

  const result = await generateObject({
    model,
    prompt,
    system,
    schema,
    abortSignal: AbortSignal.timeout(ms("45s")),
  }).catch((error) => {
    throw error;
  });

  utilLogger.debug({
    meta: {
      what: "image-prompt-generated",
    },
    data: {
      object: result.object,
      usage: result.usage,
      nsfw,
      userNote: userNote.slice(0, 100), // Log first 100 chars for debugging
      style,
      shotType,
      model: result.response.modelId,
    },
  });

  logAiSdkUsage(result, {
    component: "image_generation:persona:prompt:complete",
    useCase: "image_prompt_crafting",
  });

  return result.object;
}
