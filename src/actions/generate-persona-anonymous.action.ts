"use server";

import "server-only";

import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { TextGenerationFactory } from "@/lib/generation/text-generation/text-generation-factory";

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

Always fill every field with rich, evocative details that bring the character to life in the reader's imagination.`;
const SCHEMA = z.object({
  note_for_user: z
    .string()
    .optional()
    .describe(
      "Optional, short note for the user. It can explain how you approched the prompt, and can suggest a follow up actions and proposals for user."
    ),
  persona: z.object({
    name: z.string().describe("Character's full name or alias"),
    age: z.string().describe("Can be specific number, descriptive, or unknown"),
    gender: z.string().describe("Gender of the character"),
    universe: z.string().describe("Time period, location, and genre context"),
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
  }),
});

export async function generatePersonaAnonymousAction(prompt: string) {
  "use server";

  logger.debug(
    {
      prompt,
    },
    "Generating persona anonymous"
  );

  // const ip = await getIpAddress();
  // await personaAnonymousGenerateRatelimit.limit(ip);

  const stream = createStreamableValue();

  const model = TextGenerationFactory.forFreeUsers();

  (async () => {
    const { partialObjectStream } = await model.streamObject(SCHEMA, prompt, {
      systemPrompt: SYSTEM_PROMPT,
      onFinish: (object) => {
        logger.debug({ object }, "Persona anonymous generated");
      },
      onError: (error) => {
        logger.error({ error }, "Error generating persona anonymous");
      },
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
