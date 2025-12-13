import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logAiSdkUsage, logger } from "@/lib/logger";
import {
  personaGenerateThinkingV1,
  personaExtractV1,
} from "@/lib/prompts/registry";
import {
  CreatorPersonaGenerate,
  creatorPersonaGenerateSchema,
} from "@/schemas/shared/creator/persona-generate.schema";
import { createPersona } from "@/services/persona/create-persona";
import { auth } from "@clerk/nextjs/server";
import { streamObject, streamText } from "ai";
import { transformCreatorPersonaGenerateToPersonaData } from "@/schemas/transformers";
import ms from "ms";
import { z } from "zod";
import {
  PersonaCreatorAuthenticatedRateLimit,
  PersonaCreatorUnauthenticatedRateLimit,
  rateLimitGuard,
} from "@/lib/rate-limit";
import { getIpAddress } from "@/utils/headers-utils";
import { createPersonaVersion } from "@/services/persona/create-persona-version";
import { trackGeneratePersonaCompleted } from "@/lib/logsnag";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import {
  personaGenerationModelIds,
  personaGenerationModels,
} from "@/config/shared/models/persona-generation-models.config";
import { pickByWeightedPriority } from "@/lib/utils";

export const maxDuration = 90;

/**
 * Picks a main model and exactly two fallbacks (or fewer if not enough models)
 * using a weighted random ordering where higher priority increases chance of earlier positions.
 */
// type ModelConfig = { id: string; priority: number };

const jsonRequestSchema = z.object({
  prompt: z.string().min(1).max(2048),
  personaId: z.string().optional(),
  modelId: z.enum(personaGenerationModelIds).optional(),
});

// Phase 1: Creative thinking prompt (no schema constraints)
const THINKING_SYSTEM = personaGenerateThinkingV1.render();

// Phase 2: Extraction prompt (structured output)
const EXTRACT_SYSTEM = personaExtractV1.render();

export async function POST(req: Request) {
  const { userId } = await auth();

  /**
   * Rate Limit -->
   */
  const rateLimitter = userId
    ? PersonaCreatorAuthenticatedRateLimit
    : PersonaCreatorUnauthenticatedRateLimit;

  // Use user ID for logged in users, IP address for anonymous users
  const rateLimitIdentifier = userId ? userId : await getIpAddress();
  const rateLimitResult = await rateLimitGuard(
    rateLimitter,
    rateLimitIdentifier
  );

  if (!rateLimitResult.success) {
    return rateLimitResult.rateLimittedResponse;
  }
  // <-- Rate Limit

  const { prompt, ...json } = await req.json().then(jsonRequestSchema.parse);

  logger.debug(
    {
      payload: {
        prompt,
        ...json,
      },
    },
    "Creator - Persona Generate"
  );

  if (userId && json.personaId) {
    /**
     * Verify persona ownership before creating version
     */
    const persona = await db.query.personas.findFirst({
      where: and(
        eq(personas.id, json.personaId),
        eq(personas.userId, userId),
        ne(personas.visibility, "deleted")
      ),
      columns: {
        id: true,
      },
    });

    if (!persona) {
      return new Response(
        JSON.stringify({
          error: "PERSONA_NOT_FOUND",
          message: "Persona not found or access denied",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  const openrouter = getOpenRouter();

  // Phase 1: Creative model selection (weighted random)
  const { main: creativeModel, fallbacks: creativeFallbacks } =
    json.modelId && json.modelId !== "auto"
      ? { main: json.modelId, fallbacks: undefined }
      : pickByWeightedPriority(personaGenerationModels);

  // Phase 2: Extraction model
  const extractionModel = "x-ai/grok-4-fast";

  // Create a custom ReadableStream that implements 2-phase generation
  const customStream = new ReadableStream({
    async start(controller) {
      try {
        // ============================================================
        // PHASE 1: Generate creative thinking text
        // ============================================================
        const thinkingModelProvider = openrouter(creativeModel, {
          models: creativeFallbacks,
        });

        const thinkingResult = streamText({
          model: thinkingModelProvider,
          system: THINKING_SYSTEM,
          prompt,
          abortSignal: AbortSignal.timeout(ms("80s")),
        });

        // Stream thinking text to client
        controller.enqueue(new TextEncoder().encode('{"thinking":"'));

        let thinkingText = "";
        for await (const chunk of thinkingResult.textStream) {
          thinkingText += chunk;
          // Escape quotes and newlines for JSON streaming
          const escapedChunk = chunk
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
          controller.enqueue(new TextEncoder().encode(escapedChunk));
        }

        // Log Phase 1 usage
        const thinkingResponse = await thinkingResult.response;
        const thinkingUsage = await thinkingResult.usage;
        logAiSdkUsage(
          { response: thinkingResponse, usage: thinkingUsage },
          { component: "generation:text:stream", useCase: "persona_thinking" }
        );

        // ============================================================
        // PHASE 2: Extract structured data from thinking text
        // ============================================================
        const extractionModelProvider = openrouter(extractionModel);

        const extractionResult = streamObject({
          model: extractionModelProvider,
          schema: creatorPersonaGenerateSchema,
          system: EXTRACT_SYSTEM,
          prompt: thinkingText, // Use thinking text as input
          abortSignal: AbortSignal.timeout(ms("80s")),
        });

        let thinkingStopSent = false;

        // Stream persona object to client
        let personaDataJson = "";
        for await (const chunk of extractionResult.textStream) {
          personaDataJson += chunk;

          if (!thinkingStopSent) {
            controller.enqueue(
              new TextEncoder().encode('","isThinking":false,"persona":')
            );
            thinkingStopSent = true;
          }
          controller.enqueue(new TextEncoder().encode(chunk));
        }

        const personaData = JSON.parse(
          personaDataJson
        ) as CreatorPersonaGenerate;

        // Log Phase 2 usage
        const extractionResponse = await extractionResult.response;
        const extractionUsage = await extractionResult.usage;
        logAiSdkUsage(
          { response: extractionResponse, usage: extractionUsage },
          {
            component: "generation:text:complete",
            useCase: "persona_extraction",
          }
        );

        // ============================================================
        // DATABASE SAVE & TRACKING
        // ============================================================
        let personaId: string | undefined;
        let versionId: string | undefined;

        // Save to database if authenticated
        if (userId) {
          if (json.personaId) {
            // Add version to existing persona
            try {
              const version = await createPersonaVersion({
                aiModel: extractionResponse.modelId,
                data: transformCreatorPersonaGenerateToPersonaData(personaData),
                personaId: json.personaId,
                aiNote: personaData.note_for_user ?? undefined,
                title: personaData.title,
                userMessage: "Retry",
              });

              personaId = json.personaId;
              versionId = version;
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
              throw error;
            }
          } else {
            // Create new persona
            try {
              const result = await createPersona({
                userId,
                prompt,
                aiNote: personaData.note_for_user ?? undefined,
                aiModel: extractionResponse.modelId,
                title: personaData.title,
                data: transformCreatorPersonaGenerateToPersonaData(personaData),
              });
              personaId = result.personaId;
              versionId = result.versionId;
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              logger.error({
                event: "create_persona_failed",
                component: "api/creator/personas/generate",
                attributes: {
                  error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                  },
                  userId,
                  prompt,
                },
              });
              throw error;
            }
          }
        }

        // Track completion
        const trackingUser = userId ? userId : await getIpAddress();
        await trackGeneratePersonaCompleted({
          isAnonymous: !userId,
          userId: trackingUser,
          modelId: extractionResponse.modelId,
        });

        // Append personaId and versionId if available
        const dynamicSuffix = `${
          personaId && versionId
            ? `,"personaId":"${personaId}","versionId":"${versionId}"`
            : ""
        }}`;

        controller.enqueue(new TextEncoder().encode(dynamicSuffix));
        controller.close();
      } catch (error) {
        // Handle errors gracefully
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error({
          event: "persona-generation-failed",
          component: "api/creator/personas/generate",
          attributes: {
            error: {
              message: err.message,
              stack: err.stack,
              name: err.name,
            },
          },
        });
        controller.error(error);
      }
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
