"use server";

import { personaAnonymousGenerateRatelimit } from "@/utils/rate-limitting";
import { getIpAddress } from "@/utils/headers-utils";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { google, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { createPersona } from "@/services/persona/create-persona";
import { createPersonaVersion } from "@/services/persona/create-persona-version";
import { spendTokens } from "@/services/token/token-manager.service";

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
    throw new Error(tokenResult.error || "Insufficient tokens");
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

  (async () => {
    const model = google("gemini-2.5-flash-preview-04-17");

    const { partialObjectStream } = streamObject({
      model,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 512,
          },
        } satisfies GoogleGenerativeAIProviderOptions,
      },
      system: `You are an imaginative character architect and storytelling expert. Your mission is to craft vivid, multi-dimensional personas that feel authentically human and captivatingly unique.

When creating personas, think like a novelist building complex characters:
- Draw inspiration from diverse cultures, time periods, and walks of life
- Create compelling contradictions and hidden depths in personalities  
- Weave interesting backstories with unexpected turns and formative experiences
- Design distinctive physical features and personal quirks that make them memorable
- Consider how their environment, social class, and personal struggles shaped them
- Add subtle mysteries, secrets, or internal conflicts that make them intriguing
- Think about their speech patterns, mannerisms, and personal philosophy

Be bold and creative - avoid generic archetypes. Instead, create personas that feel like they could step off the page as real, complex individuals with rich inner lives. Make each character feel like they have stories worth telling and secrets worth discovering.

Always fill every field with rich, evocative details that bring the character to life in the reader's imagination.`,
      prompt,
      schema: z.object({
        title: z
          .string()
          .describe("Title of the persona, short, maximum one sentence"),
        note_for_user: z
          .string()
          .optional()
          .describe(
            "Optional, short note for the user. It can explain how you approched the prompt, and can suggest a follow up actions and proposals for user."
          ),
        persona: z
          .object({
            name: z.string().describe("Character's full name or alias"),
            age: z
              .string()
              .describe("Can be specific number, descriptive, or unknown"),
            gender: z.string().describe("Gender of the character"),
            universe: z
              .string()
              .describe("Time period, location, and genre context"),
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
              .describe(
                "What they do for work/role in society, can include secret occupations"
              ),
            other: z
              .string()
              .optional()
              .describe(
                "Optional field, that should be used only if user asked for something specific that does not belong to any of other categoried"
              ),
          })
          .required(),
      }),
      onFinish: async (object) => {
        userLogger.debug({ object }, "Persona generated");

        if (!object.object?.persona) {
          userLogger.error({ object }, "Persona not generated");
          return;
        }

        await createPersonaVersion({
          aiModel: "gemini-2.5-flash-lite-preview-06-17",
          personaId,
          personaEventId,
          title: object.object.title,
          personaData: object.object.persona,
          systemPromptId: "persona-generator",
          versionNumber: 1,
          aiNote: object.object?.note_for_user,
        });
      },
      onError: (error) => {
        userLogger.error({ error }, "Error generating persona");
      },
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return {
    object: stream.value,
    personaId,
    personaEventId,
    tokensUsed: tokenResult.tokensUsed,
    remainingBalance: tokenResult.remainingBalance,
    remainingDailyTokens: tokenResult.remainingDailyTokens,
  };
}
