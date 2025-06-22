"use server";

import { personaAnonymousGenerateRatelimit } from "@/utils/rate-limitting";
import { getIpAddress } from "@/utils/headers-utils";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { createPersona } from "@/services/persona/create-persona";
import { createPersonaVersion } from "@/services/persona/create-persona-version";
import { spendTokens } from "@/services/token/token-manager.service";
import { db } from "@/db/drizzle";
import { personas, personaEvents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { PersonaData } from "@/types/persona-version.type";

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
    throw new Error("Persona not found or has no current version");
  }

  // Check and deduct tokens for persona enhancement
  const tokenCost = 1; // Cost for persona enhancement
  const tokenResult = await spendTokens(
    userId,
    tokenCost,
    "Persona enhancement"
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
    "Tokens deducted for persona enhancement"
  );

  // Create persona event first
  const personaEventId = `pev_${nanoid()}`;
  await db.insert(personaEvents).values({
    id: personaEventId,
    personaId,
    userId,
    eventType: "persona_edit",
    userMessage: prompt,
    tokensCost: tokenCost,
  });

  const stream = createStreamableValue();

  // Create system prompt with current persona data
  const currentPersonaData = persona.currentVersion.personaData as PersonaData;
  const systemPrompt = `
You are a creative character enhancement assistant. You will receive the current persona data and a user request to enhance, extend, or change some aspects of the persona.

CRITICAL RULES:
1. Only modify the properties that the user specifically asks to change
2. Leave all other properties unchanged (return undefined for unchanged properties)
3. When the user asks to CHANGE or MODIFY a property, you MUST provide content that is DIFFERENT from the current value
4. When the user asks to ENHANCE or EXPAND a property, you can build upon the existing content but make it more detailed
5. Never return the exact same content as the current value when a change is requested
6. Provide complete and detailed content for any property you modify

Current persona data:
- Name: ${currentPersonaData.name}
- Age: ${currentPersonaData.age}
- Gender: ${currentPersonaData.gender}
- Universe: ${currentPersonaData.universe}
- Appearance: ${currentPersonaData.appearance}
- Personality: ${currentPersonaData.personality}
- Background: ${currentPersonaData.background}
- Occupation: ${currentPersonaData.occupation}
${currentPersonaData.other ? `- Other: ${currentPersonaData.other}` : ""}

IMPORTANT: If the user asks to change something, you must generate NEW content that is different from the current values shown above. Do not repeat the existing values.

Respond with ONLY the properties that need to be changed based on the user's request.
  `;

  userLogger.debug({ systemPrompt }, "System prompt for persona enhancement");

  (async () => {
    const model = google("gemini-2.5-flash-lite-preview-06-17");

    const { partialObjectStream } = streamObject({
      model,
      system: systemPrompt,
      prompt,
      schema: z.object({
        title: z
          .string()
          .describe(
            "A creative title for this persona version based on the complete persona after all changes - should capture the essence of who this character is"
          ),
        note_for_user: z
          .string()
          .optional()
          .describe(
            "Optional creative note with feedback on the persona, insights about the character, or follow-up suggestions for further development. Be engaging and helpful while keeping it concise"
          ),
        persona: z
          .object({
            name: z
              .string()
              .optional()
              .describe("Character's full name or alias"),
            age: z
              .string()
              .optional()
              .describe("Can be specific number, descriptive, or unknown"),
            gender: z.string().optional().describe("Gender of the character"),
            universe: z
              .string()
              .optional()
              .describe("Time period, location, and genre context"),
            appearance: z
              .string()
              .optional()
              .describe(
                "Physical description including build, features, clothing style, distinctive marks"
              ),
            personality: z
              .string()
              .optional()
              .describe(
                "Character traits, temperament, how they interact with others, emotional patterns"
              ),
            background: z
              .string()
              .optional()
              .describe(
                "Personal history, upbringing, major life events, how they became who they are"
              ),
            occupation: z
              .string()
              .optional()
              .describe(
                "What they do for work/role in society, can include secret occupations"
              ),
            other: z
              .string()
              .optional()
              .describe(
                "Optional field for specific details that don't belong to other categories"
              ),
          })
          .optional(),
      }),
      onFinish: async (object) => {
        userLogger.debug({ object }, "Persona enhancement generated");

        if (!object.object?.persona) {
          userLogger.warn({ object }, "No persona changes generated");
          return;
        }

        // Merge current data with new data
        const mergedPersonaData: PersonaData = {
          name: object.object.persona.name ?? currentPersonaData.name,
          age: object.object.persona.age ?? currentPersonaData.age,
          gender: object.object.persona.gender ?? currentPersonaData.gender,
          universe:
            object.object.persona.universe ?? currentPersonaData.universe,
          appearance:
            object.object.persona.appearance ?? currentPersonaData.appearance,
          personality:
            object.object.persona.personality ?? currentPersonaData.personality,
          background:
            object.object.persona.background ?? currentPersonaData.background,
          occupation:
            object.object.persona.occupation ?? currentPersonaData.occupation,
          other:
            object.object.persona.other ??
            (currentPersonaData.other ? currentPersonaData.other : undefined),
        };

        // Create new persona version with merged data
        await createPersonaVersion({
          aiModel: "gemini-2.5-flash-lite-preview-06-17",
          personaId,
          personaEventId,
          title: object.object.title ?? persona.title ?? undefined,
          personaData: mergedPersonaData,
          systemPromptId: "persona-enhancer",
          aiNote: object.object?.note_for_user,
        });

        userLogger.debug(
          { mergedPersonaData, personaEventId },
          "Persona enhancement completed"
        );
      },
      onError: (error) => {
        userLogger.error({ error }, "Error enhancing persona");
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
