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
    .describe(
      "A creative title for this persona version based on the complete persona after all changes - should capture the essence of who this character is. If not provided, the current persona title will be used."
    ),
  note_for_user: z
    .string()
    .optional()
    .describe(
      "Optional creative note with feedback on the persona, insights about the character, or follow-up suggestions for further development. Be engaging and helpful while keeping it concise"
    ),
  name: z
    .string()
    .optional()
    .describe(
      "Character's full name or alias - ONLY include if the user specifically requests a name change"
    ),
  age: z
    .string()
    .optional()
    .describe(
      "Can be specific number, descriptive, or unknown - ONLY include if the user specifically requests an age change"
    ),
  gender: z
    .string()
    .optional()
    .describe(
      "Gender of the character - ONLY include if the user specifically requests a gender change"
    ),
  summary: z
    .string()
    .optional()
    .describe(
      "Concise 1-2 sentence overview of the character's essence, including key traits and potential visual scene for imagery - ONLY include if the user requests summary changes or if other changes significantly impact the character's essence"
    ),
  appearance: z
    .string()
    .optional()
    .describe(
      "Physical description including build, features, clothing style, distinctive marks - ONLY include if the user requests appearance changes or if other changes would logically affect appearance"
    ),
  personality: z
    .string()
    .optional()
    .describe(
      "Character traits, temperament, how they interact with others, emotional patterns - ONLY include if the user requests personality changes or if other changes would logically affect personality"
    ),
  background: z
    .string()
    .optional()
    .describe(
      "Personal history, upbringing, major life events, how they became who they are - ONLY include if the user requests background changes or additions"
    ),
  occupation: z
    .string()
    .optional()
    .describe(
      "What they do for work/role in society, can include secret occupations - ONLY include if the user specifically requests occupation changes"
    ),
  extensions: z.preprocess((value) => {
    // If value is not an object return empty object
    if (!value || typeof value !== "object" || value === null) {
      return {};
    }

    return value;
  }, z.record(z.string(), z.string()).optional().describe("Use extensions to add extra attributes or world-building details as key–value pairs. You can use them freely to enrich the persona (e.g., abilities, relationships, lore, equipment, affiliations, goals, quirks, rules, tags, constraints, catchphrases). Key naming and casing are flexible and normalized automatically. Write descriptive, imaginative values — include as much detail as needed. Include this field only when you add or change extensions.")),
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
  const tokenResult = await spendTokens(
    userId,
    tokenCost,
    "Persona enhancement"
  );

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
  const systemPrompt = `You are an expert character writer, a creative partner helping to enhance and evolve character personas. You will receive the current persona data and a user request to enhance, extend, or change some aspects of the persona.

Your primary goal is to ensure the character remains logical, consistent, and compelling after your modifications.

**Using extensions:**
- You can use 'extensions' freely to add extra attributes or world-building details as key–value pairs (e.g., abilities, relationships, lore, equipment, affiliations, goals, quirks, rules, tags, constraints, catchphrases).
- Be creative and descriptive. Values can be as detailed and long as needed; do not limit yourself to short phrases.
- Casing and key style are flexible; they are normalized automatically.
- Prefer adding an extension when information doesn't naturally fit a core field.

**How to process requests:**

1.  **Holistic Understanding:** View the persona as a whole. A single change can have ripple effects. For instance, a new traumatic event in the 'background' should likely influence 'personality'. A change in 'occupation' from 'librarian' to 'soldier' will affect 'appearance', 'personality', and 'background'. When the user's request implies such connections, you should update all relevant fields to maintain coherence.

2.  **Respect User's Focus:** While you should make related changes for consistency, you must also respect the user's intent.
    *   If the user makes a broad request (e.g., "make him more intimidating"), you have creative freedom to adjust multiple aspects (appearance, personality, etc.).
    *   If the user makes a specific request (e.g., "expand on his childhood in the background section" or "change his hair color to red"), you should focus your changes primarily on the mentioned property. Don't rewrite unrelated parts of the persona unless it's essential for consistency.

3.  **Quality of Changes:**
    *   When a user asks to CHANGE or MODIFY a property, you must provide content that is DIFFERENT from the current value.
    *   When a user asks to ENHANCE or EXPAND, you can build upon the existing content but make it more detailed and rich.
    *   Never return the exact same content for a property you are editing.
    *   For 'extensions', provide descriptive, imaginative values. It's okay for them to be long and detailed when helpful.

**Output instructions:**
Respond with ONLY the properties that you have changed. DO NOT include properties that remain unchanged. Include 'extensions' only when you add or modify extension entries.

**CRITICAL RULES:**
- If a field is not being modified, DO NOT include it in your response at all
- Only include fields that you are actually changing or enhancing
- For basic fields like name, age, gender - only include them if the user explicitly asks to change them
- For content fields like appearance, personality, background - only include them if the user's request directly affects them or if logical consistency requires updating them
- Prefer using 'extensions' for lists, tags, affiliations, abilities, constraints, lore, or other metadata that don't belong in core fields
- When you do include a field, the content MUST be different from the current value

Current persona data:
${JSON.stringify(currentData)}

IMPORTANT: If the user asks to change something, you must generate NEW content that is different from the current values shown above. Do not repeat the existing values. Remember: ONLY include fields you are actually modifying - leave out everything else.`;

  userLogger.debug({ systemPrompt }, "System prompt for persona enhancement");

  const openRouter = getOpenRouter();
  const model = openRouter("openai/gpt-5-mini", {
    models: ["openai/gpt-oss-20b:free", "moonshotai/kimi-k2"],
  });

  (async () => {
    const { partialObjectStream } = streamObject({
      model,
      prompt,
      system: systemPrompt,
      mode: "json",
      schema: SCHEMA,
      abortSignal: AbortSignal.timeout(ms("3m")),
      onFinish: async (object) => {
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
          age: object.object.age ?? currentData.age,
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
          aiNote: object.object?.note_for_user,
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
      },
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
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
