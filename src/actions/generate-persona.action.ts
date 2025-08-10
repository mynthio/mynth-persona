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

const SYSTEM_PROMPT = `You are an imaginative character architect and storytelling expert. Your mission is to craft vivid, multi-dimensional personas that feel authentically human and captivatingly unique.

When creating personas, think like a novelist building complex characters:
- Draw inspiration from diverse cultures, time periods, and walks of life
- Create compelling contradictions and hidden depths in personalities  
- Weave interesting backstories with unexpected turns and formative experiences
- Design distinctive physical features and personal quirks that make them memorable
- Consider how their environment, social class, and personal struggles shaped them
- Add subtle mysteries, secrets, or internal conflicts that make them intriguing
- Think about their speech patterns, mannerisms, and personal philosophy

Be bold and creative - avoid generic archetypes. Instead, create personas that feel like they could step off the page as real, complex individuals with rich inner lives. Make each character feel like they have stories worth telling and secrets worth discovering.

Always fill every required field with rich, evocative details that bring the character to life in the reader's imagination. Use extensions sparingly, only for prompt-specific extras like 'skills' for game characters. If no extensions are needed, do not include the extensions field in your response.`;

const SCHEMA = z.object({
  title: z
    .string()
    .describe("Title of the persona, short, maximum one sentence"),
  note_for_user: z
    .string()
    .optional()
    .describe(
      "Optional, short note for the user. It can explain how you approched the prompt, and can suggest a follow up actions and proposals for user."
    ),
  name: z.string().describe("Character's full name or alias"),
  age: z.string().describe("Can be specific number, descriptive, or unknown"),
  gender: z.string().describe("Gender of the character"),
  summary: z
    .string()
    .describe(
      "Concise 1-2 sentence overview of the character's essence, including key traits and potential visual scene for imagery."
    ),
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
  occupation: z
    .string()
    .optional()
    .describe(
      "What they do for work/role in society, can include secret occupations"
    ),
  extensions: z.preprocess((value) => {
    // If value is not an object return empty object
    if (!value || typeof value !== "object" || value === null) {
      return {};
    }

    return value;
  }, z.record(z.string(), z.string()).optional().describe("Add extensions ONLY if the user's prompt explicitly requires or implies unique aspects as key-value pairs (e.g., {'skills': 'hacking, stealth', 'universe': 'cyberpunk'}). Keep to 2-5 max for focus. If no extensions are needed, DO NOT include this field in the response.")),
});

export async function generatePersonaAction(prompt: string) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) return redirectToSignIn();

  const userLogger = logger.child({ userId });

  userLogger.debug(
    {
      prompt,
    },
    "Generating persona"
  );

  // TODO: Rate limit by user

  // Check and deduct tokens for persona generation
  const tokenCost = 1; // Cost for persona generation
  const tokenResult = await spendTokens(
    userId,
    tokenCost,
    "Persona generation"
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
    "Tokens deducted for persona generation"
  );

  const { personaId, personaEventId } = await createPersona({
    userId,
    prompt,
  });

  userLogger.debug(
    { personaId, personaEventId },
    "Persona created and event created"
  );

  const stream = createStreamableValue();

  const openRouter = getOpenRouter();
  const model = openRouter("openai/gpt-5-mini", {
    models: ["openai/gpt-oss-20b:free", "moonshotai/kimi-k2"],
  });

  (async () => {
    const { partialObjectStream } = streamObject({
      model,
      prompt,
      system: SYSTEM_PROMPT,
      mode: "json",
      schema: SCHEMA,
      abortSignal: AbortSignal.timeout(ms("3m")),
      onFinish: async (object) => {
        userLogger.debug({ object }, "Persona generated");

        if (!object.object) {
          userLogger.error({ object }, "Persona not generated");
          await refundTokens(
            userId,
            tokenResult.tokensFromFree,
            tokenResult.tokensFromPurchased,
            "Persona generation failed: no persona object"
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

        // Check if required persona fields are present
        if (
          !object.object.name ||
          !object.object.age ||
          !object.object.gender ||
          !object.object.summary ||
          !object.object.appearance ||
          !object.object.personality ||
          !object.object.background
        ) {
          userLogger.error({ object }, "Required persona fields missing");
          await refundTokens(
            userId,
            tokenResult.tokensFromFree,
            tokenResult.tokensFromPurchased,
            "Persona generation failed: missing required fields"
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

        userLogger.info(
          {
            meta: {
              action: "generate-persona",
              what: "usage",
            },
            data: {
              usage: object.usage,
            },
          },
          "Generate Persona Usage"
        );

        // Format the persona data with snake_case extension keys
        const formattedPersonaData = {
          name: object.object.name,
          age: object.object.age,
          gender: object.object.gender,
          summary: object.object.summary,
          appearance: object.object.appearance,
          personality: object.object.personality,
          background: object.object.background,
          occupation: object.object.occupation,
          extensions: formatExtensionKeys(object.object.extensions),
        };

        await createPersonaVersion({
          aiModel: model.modelId,
          personaId,
          personaEventId,
          title: object.object.title,
          data: formattedPersonaData,
          versionNumber: 1,
          aiNote: object.object?.note_for_user,
        });

        // Maybe we can generate image for each persona so it's cool, and every persona has profile image?
        // await tasks.trigger<typeof generatePersonaImageTask>(
        //   "generate-persona-image",
        //   {
        //     persona: {
        //       id: personaId,
        //       version: {
        //         id: "1",
        //         data: object.object.persona,
        //       },
        //     } as any,
        //     userId,
        //     cost: 0,
        //     eventId: personaEventId,
        //   }
        // );

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
      },
      onError: async (error) => {
        userLogger.error({ error }, "Error generating persona");

        await refundTokens(
          userId,
          tokenResult.tokensFromFree,
          tokenResult.tokensFromPurchased,
          "Persona generation failed"
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
      userLogger.error({ error }, "Error during streaming");
      await refundTokens(
        userId,
        tokenResult.tokensFromFree,
        tokenResult.tokensFromPurchased,
        "Persona generation failed"
      );
      stream.update({ error: "Streaming failed. Please try again." });
      stream.done();
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
  };
}
