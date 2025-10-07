import { db } from "@/db/drizzle";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logAiSdkUsage, logger } from "@/lib/logger";
import {
  PersonaCreatorAuthenticatedRateLimit,
  rateLimitGuard,
} from "@/lib/rate-limit";
import { createPersonaVersion } from "@/services/persona/create-persona-version";
import { auth } from "@clerk/nextjs/server";
import { streamObject } from "ai";
import { spaceCase } from "case-anything";
import { z } from "zod/v4";
import { getPromptDefinitionById } from "@/lib/prompts/registry";
import { PromptDefinitionPersonaPropertyAction } from "@/lib/prompts/types";
import { personaNewCustomPropertyNameSchema } from "@/schemas/shared/persona/persona-property-name.schema";
import { pickByWeightedPriority } from "@/lib/utils";
import { personaGenerationModelWeights } from "@/config/shared/models/persona-generation-models.config";
import { NextResponse } from "next/server";
import ms from "ms";

export const maxDuration = 60;

const jsonRequestSchema = z.object({
  personaId: z.string(),
  property: personaNewCustomPropertyNameSchema,
  action: z.enum(["expand", "rewrite", "create"]),
});

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  /**
   * Rate Limit -->
   */
  const rateLimitResult = await rateLimitGuard(
    PersonaCreatorAuthenticatedRateLimit,
    userId
  );

  if (!rateLimitResult.success) {
    return rateLimitResult.rateLimittedResponse;
  }
  // <-- Rate Limit

  const payload = await req.json().then(jsonRequestSchema.parse);

  logger.debug(
    {
      payload,
    },
    "Creator - Persona Properties Generate"
  );

  // Authorize persona access and get current version
  const persona = await db.query.personas.findFirst({
    where: (table, { and, eq, ne }) =>
      and(
        eq(table.id, payload.personaId),
        eq(table.userId, userId),
        ne(table.visibility, "deleted")
      ),
    columns: {
      id: true,
      title: true,
    },
    with: {
      currentVersion: {
        columns: {
          data: true,
        },
      },
    },
  });

  if (!persona || !persona.currentVersion || !persona.currentVersion.data) {
    throw new Error("Persona not found");
  }

  const pickedModels = pickByWeightedPriority(personaGenerationModelWeights);

  const openrouter = getOpenRouter();
  const model = openrouter(pickedModels.main, {
    models: pickedModels.fallbacks,
  });

  const dynamicSchema = z.object({
    [payload.property]: z.string(),
  });

  // Compose system prompt using the new template
  const propertyActionSystemDef = getPromptDefinitionById(
    "system.persona.property-action.v1"
  ) as PromptDefinitionPersonaPropertyAction;
  // Map 'create' to 'rewrite' semantics for the system prompt
  const actionForPrompt: "expand" | "rewrite" =
    payload.action === "expand" ? "expand" : "rewrite";
  const system = propertyActionSystemDef.render({
    property: payload.property,
    action: actionForPrompt,
  });

  const result = streamObject({
    model,
    schema: dynamicSchema,
    system,
    prompt: `${JSON.stringify(persona.currentVersion.data)}`,
    abortSignal: AbortSignal.timeout(ms("40s")),
  });

  const { textStream } = result;

  const customStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of textStream) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }

      const response = await result.response;
      const usage = await result.usage;

      logAiSdkUsage(
        {
          response: response,
          usage: usage,
        },
        {
          component: "generation:text:complete",
          useCase: "persona_generation",
        }
      );

      const propertyResult = await result.object;
      const propertyValue = propertyResult[payload.property];

      logger.debug({ propertyValue });

      /**
       * Add version to persona
       */
      try {
        // Compute next data snapshot: update top-level if exists, otherwise add into extensions
        const currentData = persona.currentVersion!.data as any;
        const hasTopLevel =
          currentData &&
          Object.prototype.hasOwnProperty.call(currentData, payload.property);

        const nextData = hasTopLevel
          ? {
              ...currentData,
              [payload.property]: propertyValue,
            }
          : {
              ...currentData,
              extensions: {
                ...(currentData?.extensions ?? {}),
                [payload.property]: propertyValue,
              },
            };

        await createPersonaVersion({
          aiModel: model.modelId,
          data: nextData,
          personaId: payload.personaId,
          aiNote: undefined,
          title: persona.title ?? undefined,
          userMessage:
            payload.action === "expand"
              ? `Expand ${spaceCase(payload.property, {
                  keepSpecialCharacters: false,
                })}`
              : payload.action === "rewrite"
              ? `Rewrite ${spaceCase(payload.property, {
                  keepSpecialCharacters: false,
                })}`
              : `Create ${spaceCase(payload.property, {
                  keepSpecialCharacters: false,
                })}`,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        logger.error({
          event: "create-persona-version-failed",
          component: "api/creator/personas/generate",
          attributes: {
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
            },
          },
        });

        // Re-throw the error to be handled by useObject error handling
        throw error;
      }

      controller.close();
    },
  });

  // const response = await result.response;
  // const usage = await result.usage;

  // console.log(response, usage);

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
