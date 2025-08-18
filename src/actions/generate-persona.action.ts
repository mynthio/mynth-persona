"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { createPersona } from "@/services/persona/create-persona";
import { createPersonaVersion } from "@/services/persona/create-persona-version";
import {
  spendTokens,
  refundTokens,
} from "@/services/token/token-manager.service";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { eq } from "drizzle-orm";
import logsnag from "@/lib/logsnag";
import { snakeCase } from "case-anything";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { streamObject } from "ai";
import ms from "ms";
import { DAILY_FREE_TOKENS } from "@/lib/constants";
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

const personaSystemPrompt = getDefaultPromptDefinitionForMode(
  "persona",
  "generate"
).render();

const SCHEMA = z.object({
  title: z.string().describe("Short, one-line persona title."),
  note_for_user: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Optional short note for the user: how you approached the prompt and suggested follow-ups. Keep it brief and actionable. One sentence only."
    ),
  name: z.string().describe("Character's full name or alias."),
  age: z
    .preprocess(
      (val) => (typeof val === "number" ? String(val) : val),
      z.union([z.string(), z.number()])
    )
    .describe("Character's age."),
  gender: z
    .union([z.literal("male"), z.literal("female"), z.literal("other")])
    .describe("Character's gender."),
  summary: z
    .string()
    .describe(
      "Concise 1–2 sentence overview capturing only the essence. Single paragraph, no line breaks or lists. Do NOT include appearance, personality, or background details."
    ),
  appearance: z
    .string()
    .describe(
      "Purely visual and stylistic description for imagining or image generation: physique/build, facial structure/features, eyes, skin, hair, posture, wardrobe/style, color palette, materials/textures, accessories, and distinctive marks. Avoid personality or backstory."
    ),
  personality: z
    .string()
    .describe(
      "Behavioral traits and temperament: how they speak and behave; motivations, strengths, flaws, quirks, and interaction style. Avoid physical details and history."
    ),
  background: z
    .string()
    .describe(
      "Origin and history: upbringing, environment, formative events, training/skills learned, and how they became who they are. Avoid physical description."
    ),
  occupation: z
    .string()
    .nullable()
    .optional()
    .describe(
      "What they do for work/role in society. Can include secret occupations."
    ),
  extensions: z.preprocess((value) => {
    // If value is not an object, omit the field entirely
    if (!value || typeof value !== "object" || value === null) {
      return undefined;
    }

    return value;
  }, z.record(z.string(), z.string()).nullable().optional().describe("Add ONLY if the user's prompt explicitly implies unique aspects as key-value pairs (e.g., {'skills': 'hacking, stealth'}, {'universe': 'cyberpunk'}). Keep to a focused 2–5 keys. Omit the field entirely if not needed.")),
});

export async function generatePersonaAction(prompt: string) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) return redirectToSignIn();

  const userLogger = logger.child({ userId });

  userLogger.debug(
    {
      event: "persona-generate-start",
      component: "actions:generate-persona",
      attributes: { prompt },
    },
    "Generating persona"
  );

  // TODO: Rate limit by user

  // Check and deduct tokens for persona generation
  const tokenCost = 1; // Cost for persona generation
  const tokenResult = await spendTokens(userId, tokenCost);

  if (!tokenResult.success) {
    return {
      success: false,
      error: "INSUFFICIENT_TOKENS",
      message: tokenResult.error || "Insufficient tokens",
    };
  }

  userLogger.debug(
    {
      event: "tokens-deducted",
      component: "actions:generate-persona",
      attributes: {
        tokens_used: tokenResult.tokensUsed,
        remaining_balance: tokenResult.remainingBalance,
        remaining_daily_tokens: tokenResult.remainingDailyTokens,
      },
    },
    "Tokens deducted for persona generation"
  );

  const { personaId, personaEventId } = await createPersona({
    userId,
    prompt,
  });

  userLogger.debug(
    {
      event: "persona-created",
      component: "actions:generate-persona",
      attributes: { persona_id: personaId, persona_event_id: personaEventId },
    },
    "Persona created and event created"
  );

  const stream = createStreamableValue();

  const openRouter = getOpenRouter();
  const model = openRouter("mistralai/mistral-medium-3.1", {
    models: ["openai/gpt-5-mini", "moonshotai/kimi-k2"],
  });

  (async () => {
    const { partialObjectStream } = streamObject({
      model,
      prompt,
      system: personaSystemPrompt,
      schema: SCHEMA,
      abortSignal: AbortSignal.timeout(ms("3m")),
      providerOptions: {
        openrouter: {
          reasoning: {
            effort: "low",
          },
        },
      },
      onFinish: async (object) => {
        if (!object.object) {
          userLogger.error(
            {
              event: "generation-error",
              component: "actions:generate-persona",
              attributes: { object, phase: "validate-output" },
            },
            "Persona not generated"
          );
          await refundTokens(
            userId,
            tokenResult.tokensFromFree,
            tokenResult.tokensFromPurchased
          );
          await db.delete(personas).where(eq(personas.id, personaId));
          await logsnag
            .track({
              channel: "personas",
              event: "generate-persona-failed",
              user_id: userId,
              icon: "🚨",
              tags: {
                model: model.modelId,
              },
            })
            .catch((err) => {});
          return;
        }

        logger.info({
          userId,
          event: "text-generation-usage",
          component: "generation:text:complete",
          use_case: "persona_generation",
          ai_meta: {
            provider: "openrouter",
            model: model.modelId,
          },
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
        logger.flush();

        // Format the persona data with snake_case extension keys
        const formattedPersonaData = {
          name: object.object.name,
          age: String(object.object.age),
          gender: object.object.gender,
          summary: object.object.summary,
          appearance: object.object.appearance,
          personality: object.object.personality,
          background: object.object.background,
          occupation: object.object.occupation ?? undefined,
          extensions: formatExtensionKeys(
            object.object.extensions ?? undefined
          ),
        };

        await createPersonaVersion({
          aiModel: model.modelId,
          personaId,
          personaEventId,
          title: object.object.title,
          data: formattedPersonaData,
          versionNumber: 1,
          aiNote: object.object?.note_for_user ?? undefined,
        });

        await logsnag
          .track({
            channel: "personas",
            event: "generate-persona",
            user_id: userId,
            icon: "👱‍♀️",
            tags: {
              model: model.modelId,
            },
          })
          .catch((err) => {});

        logger.flush();
      },
      onError: async (error) => {
        console.error(error);
        userLogger.error(
          {
            event: "generation-error",
            component: "actions:generate-persona",
            error: {
              message: (error as any)?.message ?? String(error),
              name: (error as any)?.name,
            },
          },
          "Error generating persona"
        );

        await refundTokens(
          userId,
          tokenResult.tokensFromFree,
          tokenResult.tokensFromPurchased
        );
        await db.delete(personas).where(eq(personas.id, personaId));

        await logsnag
          .track({
            channel: "personas",
            event: "generate-persona-failed",
            user_id: userId,
            icon: "🚨",
            tags: {
              model: model.modelId,
            },
          })
          .catch((err) => {});

        stream.update({
          error: "Generation failed due to an error. Please try again.",
        });
        stream.done();
        logger.flush();
      },
    });

    if (!partialObjectStream) {
      return;
    }

    try {
      for await (const partialObject of partialObjectStream) {
        stream.update(partialObject);
      }

      stream.done();
    } catch (error) {
      userLogger.error(
        {
          event: "streaming-error",
          component: "actions:generate-persona",
          error: {
            message: (error as any)?.message ?? String(error),
            name: (error as any)?.name,
          },
        },
        "Error during streaming"
      );
      await refundTokens(
        userId,
        tokenResult.tokensFromFree,
        tokenResult.tokensFromPurchased
      );
      stream.update({ error: "Streaming failed. Please try again." });
      stream.done();
      logger.flush();
    }
  })();

  return {
    success: true,
    object: stream.value,
    personaId,
    personaEventId,
    tokensUsed: tokenResult.tokensUsed,
    remainingBalance: tokenResult.remainingBalance,
    remainingDailyTokens: tokenResult.remainingDailyTokens,
    balance: {
      totalBalance:
        tokenResult.remainingBalance + tokenResult.remainingDailyTokens,
      purchasedBalance: tokenResult.remainingBalance,
      dailyFreeTokensRemaining: tokenResult.remainingDailyTokens,
      dailyTokensUsed: DAILY_FREE_TOKENS - tokenResult.remainingDailyTokens,
      balance: tokenResult.remainingBalance + tokenResult.remainingDailyTokens, // legacy field
    },
  };
}
