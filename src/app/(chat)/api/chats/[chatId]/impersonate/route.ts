import "server-only";

import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger, logAiSdkUsage } from "@/lib/logger";
import { streamText, convertToModelMessages, smoothStream } from "ai";
import { auth } from "@clerk/nextjs/server";
import { getDefaultSystemPromptDefinitionForMode } from "@/lib/prompts/registry";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import { DEFAULT_CHAT_MODEL } from "@/config/shared/chat/chat-models.config";
import { trackChatError } from "@/lib/logsnag";
import { notFound } from "next/navigation";
import { PersonaVersionRoleplayData } from "@/schemas";
import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";
import { getChatByIdForUserCached } from "@/data/chats/get-chat.data";

import ms from "ms";
import { getUserPlan } from "@/services/auth/user-plan.service";
import {
  CHAT_RATE_LIMITS,
  rateLimitGuard,
  EcoChatRateLimit,
} from "@/lib/rate-limit";
import { PlanId } from "@/config/shared/plans";
import z from "zod";

export const maxDuration = 45;

/**
 * Lightweight payload schema for impersonation endpoint.
 * We intentionally accept extra fields (e.g. `prompt`, `event`) to stay
 * compatible with `useCompletion`'s request body while only using `parentId`.
 */
const impersonatePayloadSchema = z
  .object({
    parentId: z.string().nullable().optional(),
  })
  .passthrough();

const normalizeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    const normalized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
    };

    if (error.stack) {
      normalized.stack = error.stack;
    }

    if ("cause" in error && error.cause !== undefined) {
      normalized.cause =
        error.cause instanceof Error
          ? normalizeError(error.cause)
          : error.cause;
    }

    for (const key of Object.getOwnPropertyNames(error)) {
      if (key === "name" || key === "message" || key === "stack") {
        continue;
      }

      const value = (error as unknown as Record<string, unknown>)[key];
      if (value !== undefined) {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (typeof error === "object" && error !== null) {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { message: String(error) };
    }
  }

  return { message: String(error) };
};

// Minimal error serializer for generation errors to avoid logging stream chunks
const toMinimalError = (
  error: unknown
): { name?: string; message: string; code?: string | number } => {
  const candidate =
    error &&
    typeof error === "object" &&
    "error" in (error as unknown as { error: unknown })
      ? (error as unknown as { error: unknown }).error
      : error;

  if (candidate instanceof Error) {
    return { name: candidate.name, message: candidate.message };
  }

  if (candidate && typeof candidate === "object") {
    const obj = candidate as unknown as {
      name: string;
      code: string | number;
      message: string;
    };
    const name = typeof obj.name === "string" ? obj.name : undefined;
    const code =
      typeof obj.code === "string" || typeof obj.code === "number"
        ? obj.code
        : undefined;
    const message =
      typeof obj.message === "string" ? obj.message : String(error);

    return {
      ...(name ? { name } : {}),
      message,
      ...(code !== undefined ? { code } : {}),
    };
  }

  return { message: String(candidate ?? "unknown") };
};

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/chats/[chatId]/impersonate">
) {
  /**
   * AUTH
   */
  const { userId } = await auth();
  if (!userId) notFound();

  /**
   * PAYLOAD
   */
  const { chatId } = await ctx.params;
  const payload = await req.json().then(impersonatePayloadSchema.parseAsync);

  /**
   * FETCH CHAT
   */
  const chat = await getChatByIdForUserCached(chatId, userId);
  if (!chat) notFound();

  /**
   * PARSE CHAT
   */
  const chatPersona = chat.chatPersonas[0];
  if (
    !chatPersona ||
    !chatPersona.personaVersion ||
    !chatPersona.personaVersion.roleplayData ||
    !chatPersona.personaVersion.personaId
  ) {
    notFound();
  }

  const chatSettings = (chat.settings ?? {}) as ChatSettings;
  const roleplayData = chatPersona.personaVersion
    .roleplayData as PersonaVersionRoleplayData;

  /**
   * TEXT GENERATION MODEL
   */
  const textGenerationModel =
    textGenerationModels[chatSettings.model ?? DEFAULT_CHAT_MODEL];
  if (!textGenerationModel) throw new Error("Model not supported");

  const modelTier = textGenerationModel.tier;

  const planId = await getUserPlan();

  // Block free users from premium models
  if (modelTier === "premium" && planId === "free") {
    return new Response(
      JSON.stringify({
        error: "premium_model_not_available" as const,
      }),
      {
        status: 403,
      }
    );
  }

  // Select rate limiter based on tier
  let rateLimitter;
  if (modelTier === "eco") {
    // Eco tier uses global rate limiter
    rateLimitter = EcoChatRateLimit;
  } else if (modelTier === "premium") {
    rateLimitter = CHAT_RATE_LIMITS[planId as PlanId]["premium"];
  } else {
    // standard, free, cheap tiers use standard rate limiter
    rateLimitter = CHAT_RATE_LIMITS[planId as PlanId]["standard"];
  }

  if (!rateLimitter) {
    throw new Error("Something went wrong.");
  }

  const rateLimitResult = await rateLimitGuard(rateLimitter, userId);
  if (!rateLimitResult.success) {
    return rateLimitResult.rateLimittedResponse;
  }

  /**
   * MESSAGE HISTORY
   */
  const leafId = payload.parentId ?? null;

  const messagesHistory = leafId
    ? await getChatMessagesData(chatId, {
        messageId: leafId,
        limit: 200,
        strict: true,
      }).then((res) => res.messages)
    : [];

  /**
   * AI MODEL SETUP
   */
  const openrouter = getOpenRouter();
  const model = openrouter(
    textGenerationModel.isFreeVersionAvailable
      ? `${textGenerationModel.openRouterModelId}:free`
      : textGenerationModel.openRouterModelId,
    {
      models: textGenerationModel.isFreeVersionAvailable
        ? [textGenerationModel.openRouterModelId]
        : undefined,
      extraBody: {
        transforms: ["middle-out"],
      },
    }
  );

  /**
   * SYSTEM PROMPT
   */
  const systemPromptDefinition = getDefaultSystemPromptDefinitionForMode(
    "chat",
    "impersonate"
  );
  if (!systemPromptDefinition) throw new Error("Ups!");

  const system = systemPromptDefinition.render({
    character: roleplayData,
    user: chatSettings.user_persona,
    scenario: chatSettings.scenario,
  });

  logger.debug({ system }, "System Prompt");

  const messages = await convertToModelMessages([
    ...messagesHistory.map((msg) =>
      msg.role === "user"
        ? { ...msg, role: "assistant" as const }
        : msg.role === "assistant"
        ? { ...msg, role: "user" as const }
        : msg
    ),
  ]);

  /**
   * STREAM
   */
  const result = streamText({
    model,
    system,
    messages,

    abortSignal: AbortSignal.timeout(ms("40s")),

    experimental_transform: smoothStream({ chunking: "word" }),

    /**
     * ON ERROR
     */
    onError: async (error) => {
      logger.error(
        {
          event: "generation-error",
          component: "api:impersonate",
          error: toMinimalError(error),
        },
        "Text generation failed"
      );

      await trackChatError({
        userId,
        modelId: textGenerationModel.modelId,
      });
    },

    /**
     * ON FINISH
     */
    onFinish: async (finalData) => {
      logAiSdkUsage(finalData, {
        component: `chat:${chat.mode}:impersonate:complete`,
        useCase: "chat_message_generation",
      });
    },
  });

  return result.toTextStreamResponse();
}
