"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { createPersonaVersion } from "@/services/persona/create-persona-version";
import { spendTokens } from "@/services/token/token-manager.service";
import { db } from "@/db/drizzle";
import { personas, personaEvents, userTokens } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { PersonaData } from "@/types/persona.type";
import logsnag from "@/lib/logsnag";
import { snakeCase } from "case-anything";
import { streamObject } from "ai";
import ms from "ms";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
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

// Normalize extension keys and return a new object with keys sorted alphabetically
const normalizeAndSortExtensions = (
  extensions?: Record<string, string>
): Record<string, string> => {
  const formatted = formatExtensionKeys(extensions);
  const sortedKeys = Object.keys(formatted).sort();
  return sortedKeys.reduce((acc, key) => {
    acc[key] = formatted[key];
    return acc;
  }, {} as Record<string, string>);
};

const SCHEMA = z.object({
  title: z
    .string()
    .optional()
    .nullable()
    .describe(
      "A short creative title for this persona version that reflects the updated character. Include only if the update changes the persona's theme or identity."
    ),
  note_for_user: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Optional one-sentence note for the user: what changed and one suggestion for next iteration. Keep it brief."
    ),
  name: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Character's full name or alias — ONLY include if the user explicitly requests a name change."
    ),
  age: z
    .preprocess(
      (val) => (typeof val === "number" ? String(val) : val),
      z.union([z.string(), z.number()])
    )
    .optional()
    .nullable()
    .describe(
      "Treat as text (convert numbers to strings). ONLY include if the user explicitly requests an age change."
    ),
  gender: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Gender/pronouns — ONLY include if the user explicitly requests a gender change."
    ),
  summary: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Concise 1–2 sentences, single paragraph, no line breaks or lists. Do NOT include appearance or detailed backstory. Include only if the update impacts the essence or the user requests a summary change."
    ),
  appearance: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Purely visual and stylistic description: physique/build, facial features, eyes, skin, hair, posture, wardrobe/style, color palette, materials/textures, accessories, distinctive marks. Include only if the request affects appearance or consistency requires it."
    ),
  personality: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Behavioral traits and temperament: how they speak and behave; motivations, strengths, flaws, quirks, interaction style. Include only if the request affects personality or consistency requires it."
    ),
  background: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Origin and history: upbringing, environment, formative events, training/skills learned. Include only if the request affects background or consistency requires it."
    ),
  occupation: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Short phrase for their role/work. Include only if the user explicitly requests a change or if necessary for coherence."
    ),
  extensions: z.preprocess((value) => {
    // If value is not an object return empty object (prevents runtime spread errors and keeps semantics of "no changes")
    if (!value || typeof value !== "object" || value === null) {
      return {};
    }

    return value;
  }, z.record(z.string(), z.string()).optional().nullable().describe("Use extensions to add or modify extra attributes/world-building details as key–value pairs (e.g., abilities, relationships, lore, equipment, affiliations, goals, quirks, rules, tags, constraints, catchphrases). Be descriptive with values. Include this field only when you add or change extension entries.")),
});

export async function enhancePersonaAction(personaId: string, prompt: string) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) return redirectToSignIn();

  const userLogger = logger.child({ userId });

  userLogger.debug(
    {
      prompt,
    },
    "Enhancing persona"
  );

  // Get persona with current version
  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.id, personaId), eq(personas.userId, userId)),
    with: {
      currentVersion: true,
    },
  });

  if (!persona || !persona.currentVersion) {
    return {
      success: false,
      error: "PERSONA_NOT_FOUND",
      message: "Persona not found or has no current version",
    };
  }

  // Check and deduct tokens for persona enhancement
  const tokenCost = 1; // Cost for persona enhancement
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
      tokensUsed: tokenResult.tokensUsed,
      remainingBalance: tokenResult.remainingBalance,
      remainingDailyTokens: tokenResult.remainingDailyTokens,
    },
    "Tokens deducted for persona enhancement"
  );

  // Create persona event first
  const personaEventId = `pev_${nanoid()}`;
  await db.insert(personaEvents).values({
    id: personaEventId,
    personaId,
    userId,
    type: "persona_edit",
    userMessage: prompt,
    tokensCost: tokenCost,
  });

  const stream = createStreamableValue();

  // Create system prompt with current persona data
  const currentData = persona.currentVersion.data as PersonaData;
  const systemPrompt = getDefaultPromptDefinitionForMode(
    "persona",
    "enhance"
  ).render({ current: currentData });

  userLogger.debug({ systemPrompt }, "System prompt for persona enhancement");

  const openRouter = getOpenRouter();
  const model = openRouter("moonshotai/kimi-k2", {
    models: ["openai/gpt-oss-20b:free", "moonshotai/kimi-k2"],
  });

  (async () => {
    const { partialObjectStream } = streamObject({
      model,
      prompt,
      system: systemPrompt,
      schema: SCHEMA,
      abortSignal: AbortSignal.timeout(ms("50s")),
      providerOptions: {
        openrouter: {
          reasoning: {
            effort: "low",
          },
        },
      },
      onFinish: async (object) => {
        console.log(object);
        userLogger.debug(
          { data: object.object },
          "Persona enhancement generated"
        );

        logger.info({
          userId,
          event: "text-generation-usage",
          component: "generation:text:complete",
          use_case: "persona_enhancement",
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

        if (!object.object) {
          userLogger.warn({ object }, "No object generated");
          return;
        }

        // Check if any persona fields were changed
        const basicFields = [
          "name",
          "age",
          "gender",
          "summary",
          "appearance",
          "personality",
          "background",
          "occupation",
        ] as const;

        const hasBasicChanges = basicFields.some(
          (field) => object.object![field] !== undefined
        );

        // Check if extensions have actually changed
        const newExtensions = object.object.extensions;
        const currentExtensions = currentData.extensions || {};
        const normalizedNewExtensions = newExtensions
          ? normalizeAndSortExtensions(newExtensions)
          : undefined;
        const normalizedCurrentExtensions =
          normalizeAndSortExtensions(currentExtensions);
        const hasExtensionChanges =
          normalizedNewExtensions &&
          Object.keys(normalizedNewExtensions).length > 0 &&
          JSON.stringify(normalizedNewExtensions) !==
            JSON.stringify(normalizedCurrentExtensions);

        if (!hasBasicChanges && !hasExtensionChanges) {
          userLogger.warn({ object }, "No persona changes generated");
          return;
        }

        // Merge current data with new data
        const mergedData: PersonaData = {
          name: object.object.name ?? currentData.name,
          age: (object.object.age as any) ?? currentData.age,
          gender: object.object.gender ?? currentData.gender,
          appearance: object.object.appearance ?? currentData.appearance,
          personality: object.object.personality ?? currentData.personality,
          background: object.object.background ?? currentData.background,
          summary: object.object.summary ?? currentData.summary ?? "", // Fallback to empty if not present in old data
          occupation: object.object.occupation ?? currentData.occupation,
          extensions: formatExtensionKeys({
            ...currentData.extensions,
            ...object.object.extensions,
          }),
        };

        // Build changed properties list more accurately
        const changedProperties: string[] = [];

        // Check basic fields
        basicFields.forEach((field) => {
          if (object.object![field] !== undefined) {
            changedProperties.push(field);
          }
        });

        // Check extensions separately
        if (hasExtensionChanges) {
          changedProperties.push("extensions");
        }

        // Create new persona version with merged data
        await createPersonaVersion({
          aiModel: model.modelId,
          personaId,
          personaEventId,
          title: object.object.title ?? persona.title ?? undefined,
          data: mergedData,
          aiNote: object.object?.note_for_user ?? undefined,
          changedProperties,
        });

        userLogger.debug(
          { mergedData, personaEventId },
          "Persona enhancement completed"
        );

        await logsnag
          .track({
            channel: "personas",
            event: "enhance-persona",
            user_id: userId,
            icon: "✨",
            tags: {
              model: model.modelId,
            },
          })
          .catch((err) => {});
      },
      onError: async (error) => {
        console.error(error);
        userLogger.error({ error }, "Error enhancing persona");

        await db
          .update(personaEvents)
          .set({
            errorMessage: "Something went wrong while enhancing persona",
          })
          .where(eq(personaEvents.id, personaEventId));

        await db.update(userTokens).set({
          balance: sql`balance + ${tokenCost}`,
        });

        await logsnag
          .track({
            channel: "personas",
            event: "enhance-persona-failed",
            user_id: userId,
            icon: "🚨",
            tags: {
              model: model.modelId,
            },
          })
          .catch((err) => {});

        // Notify client and terminate the stream to prevent hanging UI
        stream.update({
          error: "Enhancement failed. Please try again.",
        } as any);
        stream.done();
      },
    });

    // Guard against providers that don't support partial streaming
    if (!partialObjectStream) {
      userLogger.warn(
        { component: "actions:enhance-persona" },
        "No partialObjectStream available; finishing without streaming"
      );
      stream.done();
      return;
    }

    try {
      for await (const partialObject of partialObjectStream) {
        // Normalize extension keys in streamed partials for UI merging consistency
        if ((partialObject as any)?.extensions) {
          (partialObject as any).extensions = formatExtensionKeys(
            (partialObject as any).extensions as Record<string, string>
          );
        }
        stream.update(partialObject);
      }

      stream.done();
    } catch (error) {
      userLogger.error(
        {
          event: "streaming-error",
          component: "actions:enhance-persona",
          error: {
            message: (error as any)?.message ?? String(error),
            name: (error as any)?.name,
          },
        },
        "Error during streaming"
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
      balance: tokenResult.remainingBalance + tokenResult.remainingDailyTokens,
    },
  };
}
