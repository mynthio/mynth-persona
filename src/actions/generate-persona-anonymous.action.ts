"use server";

import "server-only";

import { createStreamableValue } from "@ai-sdk/rsc";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getIpAddress } from "@/utils/headers-utils";
import { personaAnonymousGenerateRatelimit } from "@/utils/rate-limitting";
import logsnag from "@/lib/logsnag";
import { snakeCase } from "case-anything";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { streamObject } from "ai";
import ms from "ms";
import { getDefaultPromptDefinitionForMode } from "@/lib/prompts/registry";

// Utility function to format extension keys to snake_case (lowercase)
const formatExtensionKeys = (
  extensions?: Record<string, string>
): Record<string, string> => {
  if (!extensions) return {};

  return Object.entries(extensions).reduce((acc, [key, value]) => {
    const formattedKey = snakeCase(key);
    acc[formattedKey] = value;
    return acc;
  }, {} as Record<string, string>);
};

const SCHEMA = z.object({
  note_for_user: z
    .string()
    .optional()
    .describe(
      "Optional, short note for the user. It can explain how you approched the prompt, and can suggest a follow up actions and proposals for user."
    ),
  name: z.string().describe("Character's full name or alias"),
  age: z.string().describe("Can be specific number, descriptive, or unknown"),
  gender: z.string().describe("Gender of the character"),
  appearance: z
    .string()
    .describe(
      "Physical description including build, features, clothing style, distinctive marks"
    ),
  personality: z
    .string()
    .describe(
      "Character traits, temperament, how they interact with others, emotional patterns"
    ),
  background: z
    .string()
    .describe(
      "Personal history, upbringing, major life events, how they became who they are"
    ),
  summary: z
    .string()
    .describe(
      "Concise 1-2 sentence overview of the character's essence, including key traits and potential visual scene for imagery."
    ),
  occupation: z
    .string()
    .optional()
    .describe(
      "What they do for work/role in society, can include secret occupations"
    ),
  extensions: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      "Add extensions ONLY if the user's prompt explicitly requires or implies unique aspects as key-value pairs (e.g., {'skills': 'hacking, stealth', 'universe': 'cyberpunk'}). Keep to 3-5 max for focus."
    ),
});

export async function generatePersonaAnonymousAction(prompt: string) {
  logger.debug(
    {
      meta: {
        who: "generate-persona-anonymous",
        what: "prompt",
      },
      data: {
        prompt,
      },
    },
    "Generating Persona by anonymous user"
  );

  if (process.env.NODE_ENV === "production") {
    const ip = await getIpAddress();
    const rateLimitResult = await personaAnonymousGenerateRatelimit.limit(ip);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: "Rate limit exceeded",
      };
    }
  }

  const stream = createStreamableValue();

  const openRouter = getOpenRouter();
  const model = openRouter("openai/gpt-oss-20b:free", {
    models: [
      "qwen/qwen2.5-vl-32b-instruct:free",
      "mistralai/mistral-small-3.1-24b-instruct:free",
      "meta-llama/llama-3.1-405b-instruct:free",
    ],
  });

  logger.debug({
    meta: {
      who: "generate-persona-anonymous",
      what: "model-selection",
    },
    data: {
      modelId: model.modelId,
    },
  });

  (async () => {
    const { partialObjectStream } = streamObject({
      model,
      prompt,
      system: getDefaultPromptDefinitionForMode("persona", "generate").render(),
      schema: SCHEMA,
      abortSignal: AbortSignal.timeout(ms("3m")),
      onFinish: async (object) => {
        logger.debug({ data: { object } }, "Persona anonymous generated");

        if (!object.object) {
          logger.error(
            {
              meta: {
                who: "generate-persona-anonymous",
                what: "persona-generation-error",
              },
              data: {
                object,
              },
            },
            "Persona not generated"
          );
          return;
        }

        logger.info({
          event: "text-generation-usage",
          component: "generation:text:complete",
          use_case: "anonymous_persona_generation",
          ai_meta: { provider: "openrouter", model: model.modelId },
          attributes: {
            usage: {
              input_tokens: object.usage.inputTokens ?? 0,
              output_tokens: object.usage.outputTokens ?? 0,
              total_tokens: object.usage.totalTokens ?? 0,
              reasoning_tokens: object.usage.reasoningTokens ?? 0,
              cached_input_tokens: object.usage.cachedInputTokens ?? 0,
            },
          },
        });

        await logsnag
          .track({
            channel: "personas",
            event: "generate-persona-anonymous",
            icon: "👱‍♀️",
            tags: {
              model: model.modelId,
            },
          })
          .catch((err) => {});
        logger.flush();
      },
      onError: async (error) => {
        logger.error({ error }, "Error generating persona anonymous");

        await logsnag
          .track({
            channel: "personas",
            event: "generate-persona-anonymous-failed",
            icon: "🚨",
            tags: {
              model: model.modelId,
            },
          })
          .catch((err) => {});
        logger.flush();
      },
    });

    for await (const partialObject of partialObjectStream) {
      // Format extensions in the partial object if present
      if (partialObject?.extensions) {
        partialObject.extensions = formatExtensionKeys(
          partialObject.extensions as Record<string, string>
        );
      }
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { success: true, object: stream.value };
}
