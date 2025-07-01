"use server";

import { createStreamableValue } from "ai/rsc";
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
import { TextGenerationFactory } from "@/lib/generation/text-generation/text-generation-factory";

const SCHEMA = z.object({
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
      name: z.string().optional().describe("Character's full name or alias"),
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
- Name: ${currentData.name}
- Age: ${currentData.age}
- Gender: ${currentData.gender}
- Universe: ${currentData.universe}
- Appearance: ${currentData.appearance}
- Personality: ${currentData.personality}
- Background: ${currentData.background}
- Occupation: ${currentData.occupation}
${currentData.other ? `- Other: ${currentData.other}` : ""}

IMPORTANT: If the user asks to change something, you must generate NEW content that is different from the current values shown above. Do not repeat the existing values.

Respond with ONLY the properties that need to be changed based on the user's request.
  `;

  userLogger.debug({ systemPrompt }, "System prompt for persona enhancement");

  const model = TextGenerationFactory.byQuality("medium");

  (async () => {
    const { partialObjectStream } = await model.streamObject(SCHEMA, prompt, {
      systemPrompt,
      onFinish: async (object) => {
        userLogger.debug({ object }, "Persona enhancement generated");

        if (!object.object?.persona) {
          userLogger.warn({ object }, "No persona changes generated");
          return;
        }

        // Merge current data with new data
        const mergedData: PersonaData = {
          name: object.object.persona.name ?? currentData.name,
          age: object.object.persona.age ?? currentData.age,
          gender: object.object.persona.gender ?? currentData.gender,
          universe: object.object.persona.universe ?? currentData.universe,
          appearance:
            object.object.persona.appearance ?? currentData.appearance,
          personality:
            object.object.persona.personality ?? currentData.personality,
          background:
            object.object.persona.background ?? currentData.background,
          occupation:
            object.object.persona.occupation ?? currentData.occupation,
          other:
            object.object.persona.other ??
            (currentData.other ? currentData.other : undefined),
        };

        const changedProperties = Object.keys(object.object.persona);

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
  };
}
