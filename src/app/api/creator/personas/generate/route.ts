import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logAiSdkUsage, logger } from "@/lib/logger";
import { getDefaultPromptDefinitionForMode } from "@/lib/prompts/registry";
import {
  CreatorPersonaGenerate,
  creatorPersonaGenerateSchema,
} from "@/schemas/shared/creator/persona-generate.schema";
import { createPersona } from "@/services/persona/create-persona";
import { auth } from "@clerk/nextjs/server";
import { streamObject } from "ai";
import { transformCreatorPersonaGenerateToPersonaData } from "@/schemas/transformers";
import ms from "ms";
import { z } from "zod/v4";
import {
  GeneratePersonaAuthenticatedRatelimit,
  GeneratePersonaUnauthenticatedRatelimit,
} from "@/lib/rate-limit";
import { getIpAddress } from "@/utils/headers-utils";
import { createPersonaVersion } from "@/services/persona/create-persona-version";
import { trackGeneratePersonaCompleted } from "@/lib/logsnag";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

export const maxDuration = 90;

const MODELS_CONFIG = [
  {
    id: "auto",
    priority: 0,
  },
  {
    id: "thedrummer/anubis-70b-v1.1",
    priority: 0.5,
  },
  {
    id: "meta-llama/llama-4-maverick",
    priority: 0.2,
  },
  {
    id: "moonshotai/kimi-k2-0905",
    priority: 0.5,
  },
  {
    id: "x-ai/grok-3-mini",
    priority: 0.3,
  },
  {
    id: "sao10k/l3.3-euryale-70b",
    priority: 0.5,
  },
];

/**
 * Picks a main model and exactly two fallbacks (or fewer if not enough models)
 * using a weighted random ordering where higher priority increases chance of earlier positions.
 */
type ModelConfig = { id: string; priority: number };

function pickModels(config: ModelConfig[] = MODELS_CONFIG): {
  main: string;
  fallbacks: string[];
} {
  // Use Efraimidis–Spirakis method for weighted random ordering without replacement
  // key = -ln(U) / weight; sort ascending by key
  const valid = config.filter(
    (m) => m && typeof m.priority === "number" && m.priority > 0
  );
  const pool = valid.length > 0 ? valid : config;

  const keyed = pool.map((m) => {
    const u = Math.random();
    const weight = Math.max(1e-6, m.priority || 0); // safeguard to avoid divide-by-zero
    const key = -Math.log(u) / weight;
    return { id: m.id, key };
  });

  keyed.sort((a, b) => a.key - b.key);

  const picks = keyed.slice(0, 3).map((k) => k.id);
  const main = picks[0] ?? pool[0]?.id ?? config[0]?.id ?? "";
  const fallbacks = picks.slice(1, 3).filter(Boolean);

  return { main, fallbacks };
}

const jsonRequestSchema = z.object({
  prompt: z.string().min(1).max(2048),
  personaId: z.string().optional(),
  modelId: z.enum(MODELS_CONFIG.map((m) => m.id)).optional(),
});

const SYSTEM = getDefaultPromptDefinitionForMode(
  "persona",
  "generate"
).render();

export async function POST(req: Request) {
  const { userId } = await auth();

  /**
   * Rate Limit -->
   */
  if (process.env.NODE_ENV === "production") {
    const rateLimitter = userId
      ? GeneratePersonaAuthenticatedRatelimit
      : GeneratePersonaUnauthenticatedRatelimit;

    // Use user ID for logged in users, IP address for anonymous users
    const rateLimitIdentifier = userId ? userId : await getIpAddress();
    const rateLimitResult = await rateLimitter.limit(rateLimitIdentifier);

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_exceeded" as const,

          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        }),
        {
          status: 429,
        }
      );
    }
  }
  // <-- Rate Limit

  const { prompt, ...json } = await req.json().then(jsonRequestSchema.parse);

  logger.debug({
    prompt,
    json,
  });

  const openrouter = getOpenRouter();

  const { main, fallbacks } =
    json.modelId && json.modelId !== "auto"
      ? { main: json.modelId, fallbacks: undefined }
      : pickModels(MODELS_CONFIG);

  const model = openrouter(main, {
    models: fallbacks,
  });

  const result = streamObject({
    model,
    schema: creatorPersonaGenerateSchema,
    system: SYSTEM,
    prompt,
    abortSignal: AbortSignal.timeout(ms("80s")),
  });

  const { textStream } = result;

  // Prefix: Start of wrapper object with persona content
  const prefix = '{"persona":';

  // Create a custom ReadableStream that injects the wrapper
  const customStream = new ReadableStream({
    async start(controller) {
      // Enqueue prefix first
      controller.enqueue(new TextEncoder().encode(prefix));

      let personaDataJson = "";

      // Stream the inner object's text chunks
      for await (const chunk of textStream) {
        personaDataJson += chunk;
        controller.enqueue(new TextEncoder().encode(chunk));
      }

      const personaData = JSON.parse(personaDataJson) as CreatorPersonaGenerate;

      let personaId: string | undefined;
      let versionId: string | undefined;

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

      // If we have a user, we're going to create a persona in DB
      if (userId) {
        if (json.personaId) {
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
              userId: true,
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

          /**
           * Add version to persona
           */
          try {
            const version = await createPersonaVersion({
              aiModel: response.modelId,
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

            // Re-throw the error to be handled by useObject error handling
            throw error;
          }
        } else {
          /**
           * Create new Persona with version
           */
          try {
            const result = await createPersona({
              userId,
              prompt,
              aiNote: personaData.note_for_user ?? undefined,
              aiModel: response.modelId,
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

            // Re-throw the error to be handled by useObject error handling
            throw error;
          }
        }
      }

      const trackingUser = userId ? userId : await getIpAddress();
      await trackGeneratePersonaCompleted({
        isAnonymous: !userId,
        userId: trackingUser,
        modelId: response.modelId,
      });

      // Create dynamic suffix with actual IDs
      const dynamicSuffix = `${
        personaId && versionId
          ? `,"personaId":"${personaId}","versionId":"${versionId}"`
          : ""
      }}`;

      // Enqueue suffix last
      controller.enqueue(new TextEncoder().encode(dynamicSuffix));

      controller.close();
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
