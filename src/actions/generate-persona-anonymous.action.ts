"use server";

import "server-only";

import { personaAnonymousGenerateRatelimit } from "@/utils/rate-limitting";
import { getIpAddress } from "@/utils/headers-utils";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export async function generatePersonaAnonymousAction(prompt: string) {
  "use server";

  // const ip = await getIpAddress();
  // await personaAnonymousGenerateRatelimit.limit(ip);

  const stream = createStreamableValue();

  (async () => {
    const model = google("gemini-2.5-flash-preview-04-17");

    const { partialObjectStream } = streamObject({
      model,
      system:
        "You are a creative character generator. Create detailed, engaging personas based on user requests. Always fill all fields with rich, descriptive content that brings the character to life.",
      prompt,
      schema: z.object({
        name: z.string().describe("Character's full name or alias"),
        age: z
          .string()
          .describe("Can be specific number, descriptive, or unknown"),
        universe: z
          .string()
          .describe("Time period, location, and genre context"),
        species: z.string().describe("What type of being they are"),
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
      }),
      onFinish: (object) => {
        console.log(object);
      },
      onError: (error) => {
        console.error(error);
      },
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}

/**
 * "universe": {
              "type": "STRING",
              "description": "Time period, location, and genre context"
            },
            "species": {
              "type": "STRING",
              "description": "What type of being they are"
            },
            "appearance": {
              "type": "STRING",
              "description": "Physical description including build, features, clothing style, distinctive marks"
            },
            "personality": {
              "type": "STRING",
              "description": "Character traits, temperament, how they interact with others, emotional patterns"
            },
            "background": {
              "type": "STRING",
              "description": "Personal history, upbringing, major life events, how they became who they are"
            },
            "occupation": {
              "type": "STRING",
              "description": "What they do for work/role in society, can include secret occupations"
            },
            "social_status": {
              "type": "STRING",
              "description": "Their position/rank in their society's hierarchy"
            },
            "location": {
              "type": "STRING",
              "description": "Where they currently live/operate within their universe"
            },
            "relationships": {
              "type": "STRING",
              "description": "Family, friends, enemies, romantic interests, professional connections"
            },
            "skills": {
              "type": "STRING",
              "description": "Abilities, talents, training, supernatural powers, areas of expertise"
            },
            "quirks": {
              "type": "STRING",
              "description": "Habits, mannerisms, unique behaviors, things that make them memorable"
            },
            "goals": {
              "type": "STRING",
              "description": "What they want to achieve, their motivations, dreams, ambitions"
            },
            "fears": {
              "type": "STRING",
              "description": "What they're afraid of, weaknesses, things that hold them back"
            }
          },
 */
