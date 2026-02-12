import "server-only";

import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger, logAiSdkUsage } from "@/lib/logger";
import { streamText, convertToModelMessages, smoothStream } from "ai";
import { db } from "@/db/drizzle";
import { eq, sql } from "drizzle-orm";
import { chats, messages as messagesTable } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { getSystemPromptRendererForRoleplay } from "@/lib/prompts/roleplay";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import { trackChatError } from "@/lib/logsnag";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { PersonaVersionRoleplayData } from "@/schemas";
import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";
import { getChatByIdForUserCached } from "@/data/chats/get-chat.data";

import { redis } from "@/lib/redis";
import ms from "ms";
import { getUserPlan } from "@/services/auth/user-plan.service";
import {
  selectTextGenerationModel,
  checkPremiumModelAccess,
  checkChatRateLimit,
} from "@/services/chat/chat-utils.service";
import z from "zod";

export const maxDuration = 45;

const continuePayloadSchema = z.object({
  messageId: z.string(),
  parentId: z.string().nullable(),
  modelId: z.string().optional(),
  authorNote: z.string().nullable().optional(),
});

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
  ctx: RouteContext<"/api/chats/[chatId]/continue">
) {
  /**
   * AUTH
   */
  const { userId } = await auth();
  if (!userId) notFound();

  const planId = await getUserPlan();

  /**
   * PAYLOAD
   */
  const { chatId } = await ctx.params;
  const payload = await req.json().then(continuePayloadSchema.parseAsync);

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

  const authorNote = payload.authorNote ?? null;

  /**
   * TEXT GENERATION MODEL
   */
  const { resolvedModelId, textGenerationModel, modelTier } =
    selectTextGenerationModel(payload.modelId, chatSettings.model);

  // Block free users from premium models
  const premiumAccessError = checkPremiumModelAccess(modelTier, planId);
  if (premiumAccessError) {
    return premiumAccessError;
  }

  // Check rate limits
  const rateLimitError = await checkChatRateLimit(modelTier, planId, userId);
  if (rateLimitError) {
    return rateLimitError;
  }

  /**
   * MESSAGE HISTORY
   * Fetch up to the assistant message we want to continue (messageId IS the assistant message)
   */
  const messagesHistory = await getChatMessagesData(chatId, {
    messageId: payload.messageId,
    limit: 50,
    strict: true,
  }).then((res) => res.messages);

  const lastMessage = messagesHistory.at(-1);
  if (!lastMessage || lastMessage.role !== "assistant") {
    return new Response("Last message must be an assistant message", {
      status: 400,
    });
  }

  // Get existing text from the assistant message to know what we're continuing from
  const existingText = lastMessage.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");

  /**
   * CHECKPOINT SUPPORT
   */
  const lastCheckpointIndex = messagesHistory.findLastIndex(
    (message) => !!message.metadata?.checkpoint
  );
  const previousCheckpointIndex =
    lastCheckpointIndex > 0
      ? messagesHistory.findLastIndex(
          (message, i) =>
            !!message.metadata?.checkpoint && lastCheckpointIndex !== i
        )
      : 0;

  const messagesAfterCheckpointCount =
    lastCheckpointIndex > 0
      ? messagesHistory.length - lastCheckpointIndex
      : messagesHistory.length;

  const indexOfCheckpointToUse =
    messagesAfterCheckpointCount > 24
      ? lastCheckpointIndex
      : previousCheckpointIndex;

  const checkpointContentToUse = indexOfCheckpointToUse
    ? messagesHistory.at(indexOfCheckpointToUse)?.metadata?.checkpoint?.content
    : undefined;

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
  const roleplayRenderer = getSystemPromptRendererForRoleplay(resolvedModelId);
  const system = roleplayRenderer({
    character: roleplayData,
    user: chatSettings.user_persona,
    scenario: chatSettings.scenario,
    lastCheckpointSummary: checkpointContentToUse,
    authorNote,
  });

  /**
   * MESSAGES — history ends with assistant message = assistant prefill
   */
  const messagesTillCheckpoint = messagesHistory.slice(
    indexOfCheckpointToUse && indexOfCheckpointToUse > 0
      ? indexOfCheckpointToUse
      : 0
  );

  const messages = await convertToModelMessages(messagesTillCheckpoint);

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
          component: "api:continue",
          error: toMinimalError(error),
        },
        "Text generation failed (continue)"
      );

      await trackChatError({
        userId,
        modelId: textGenerationModel.modelId,
      });
    },

    /**
     * ON FINISH — UPDATE the existing assistant message (append new text)
     */
    onFinish: async (finalData) => {
      logAiSdkUsage(finalData, {
        component: `chat:${chat.mode}:continue:complete`,
        useCase: "chat_message_generation",
      });

      if (finalData.text) {
        const continuedText = existingText + finalData.text;

        await db
          .update(messagesTable)
          .set({
            parts: [{ type: "text", text: continuedText }],
            metadata: sql`coalesce(${messagesTable.metadata}, '{}'::jsonb) || ${JSON.stringify(
              {
                usage: finalData.usage,
                model: textGenerationModel.modelId,
              }
            )}::jsonb`,
            updatedAt: sql`now()`,
          })
          .where(eq(messagesTable.id, payload.messageId));
      }
    },
  });

  after(async () => {
    await redis.del(`chat:${chatId}:leaf`).catch((error) => {
      logger.error(
        {
          event: "kv-error",
          component: "api:continue",
          error: normalizeError(error),
        },
        "Failed to clear chat leaf in KV store"
      );
    });

    await db
      .update(chats)
      .set({ updatedAt: sql`now()` })
      .where(eq(chats.id, chatId));
  });

  return result.toTextStreamResponse();
}
