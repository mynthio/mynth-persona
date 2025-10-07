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

const SCHEMA = z.object({
  prompt: z
    .string()
    .describe(
      "The final prompt for the image generation model. Do not exceed 3000 characters."
    ),
});

export async function craftImagePromptForPersona(
  payload: CraftImagePromptForPersonaPayload
): Promise<{ prompt: string }> {
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
  const system = getDefaultPromptDefinitionForMode("image", "persona").render({
    modelName,
    nsfw,
  });

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
  const model = openRouter("x-ai/grok-4-fast:free", {
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
      what: "image-prompt-generated",
    },
    data: {
      object: result.object,
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
