import "server-only";

import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger, logAiSdkUsage } from "@/lib/logger";
import {
  streamText,
  convertToModelMessages,
  smoothStream,
  createUIMessageStreamResponse,
  createUIMessageStream,
} from "ai";
import { nanoid } from "nanoid";
import { db } from "@/db/drizzle";
import { eq, sql } from "drizzle-orm";
import { chats, messages as messagesTable } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { getDefaultPromptDefinitionForMode } from "@/lib/prompts/registry";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import { DEFAULT_CHAT_MODEL } from "@/config/shared/chat/chat-models.config";
import { trackChatError } from "@/lib/logsnag";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  messageEventPayloadSchema,
  PersonaVersionRoleplayData,
} from "@/schemas";
import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";
import { getChatByIdForUserCached } from "@/data/chats/get-chat.data";

import { kv } from "@vercel/kv";
import ms from "ms";
import { getUserPlan } from "@/services/auth/user-plan.service";
import { CHAT_RATE_LIMITS, rateLimitGuard } from "@/lib/rate-limit";
import { PlanId } from "@/config/shared/plans";

export const maxDuration = 45;

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
  ctx: RouteContext<"/api/chats/[chatId]/chat">
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
  const payload = await req.json().then(messageEventPayloadSchema.parseAsync);

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

  const isPremiumModel = textGenerationModel.isPremium;

  const planId = await getUserPlan();

  if (isPremiumModel && planId === "free") {
    return new Response(
      JSON.stringify({
        error: "premium_model_not_available" as const,
      }),
      {
        status: 403,
      }
    );
  }

  const rateLimitter =
    CHAT_RATE_LIMITS[planId as PlanId][isPremiumModel ? "premium" : "standard"];

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
  const leafId = payload.parentId;

  const messagesHistory = leafId
    ? await getChatMessagesData(chatId, {
        messageId: leafId,
        limit: 200,
        strict: true,
      }).then((res) => res.messages)
    : [];
  const lastMessage = messagesHistory.at(-1);

  // Some checks and gaurds for message events and payloads based on history
  // Last message should be assistant if user is sending a new message
  if (payload.event === "send" && lastMessage?.role === "user") {
    throw new Error("Invalid Message and Event");
  }

  if (payload.event === "regenerate") {
    if (lastMessage?.role === "user") {
      throw new Error("Invalid Message and Event");
    }
  }

  /**
   * Insert message into database
   */
  if (payload.event === "send" || payload.event === "edit_message") {
    await db.insert(messagesTable).values({
      id: payload.message.id,
      parts: payload.message.parts,
      role: "user",
      chatId,
      parentId: lastMessage?.id ?? null,
    });
  }

  /**
   * AI MODEL SETUP
   */
  const openrouter = getOpenRouter();
  const model = openrouter(
    textGenerationModel.isFreeVersionAvailable
      ? `${textGenerationModel.modelId}:free`
      : textGenerationModel.modelId,
    {
      models: textGenerationModel.isFreeVersionAvailable
        ? [textGenerationModel.modelId]
        : undefined,
      extraBody: {
        transforms: ["middle-out"],
      },
    }
  );

  /**
   * SYSTEM PROMPT
   */
  const systemPromptDefinition = getDefaultPromptDefinitionForMode(
    "chat",
    chat.mode
  );
  if (!systemPromptDefinition) throw new Error("Ups!");

  const system = systemPromptDefinition.render({
    character: roleplayData,
    user: chatSettings.user_persona,
    scenario: chatSettings.scenario,
  });

  logger.debug({ system }, "System Prompt");

  /**
   * MESSAGES
   */
  const messages = convertToModelMessages([
    ...messagesHistory,
    payload.message,
  ]);

  /**
   * STREAM
   */
  const stream = createUIMessageStream<PersonaUIMessage>({
    generateId: () => `msg_${nanoid(32)}`,

    execute: async ({ writer }) => {
      // Guard to ensure single error handling per stream
      let hasStreamErrorHandled = false;

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
          // Prevent multiple error handling for a single stream
          if (hasStreamErrorHandled) {
            return;
          }
          hasStreamErrorHandled = true;
          logger.error(
            {
              event: "generation-error",
              component: "api:chat",
              error: toMinimalError(error),
            },
            "Text generation failed"
          );

          await kv.del(`chat:${chatId}:leaf`).catch((error) => {
            logger.error(
              {
                event: "kv-error",
                component: "api:chat",
                error: normalizeError(error),
              },
              "Failed to clear chat leaf in KV store"
            );

            // Let's don't break the flow just because of this
          });

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
            component: `chat:${chat.mode}:chat_message:complete`,
            useCase: "chat_message_generation",
          });
        },
      }); // END: Stream Text

      writer.merge(result.toUIMessageStream());

      const usage = await result.usage;

      writer.write({
        type: "message-metadata",
        messageMetadata: {
          parentId: payload.message.id,
          usage,
        },
      });
    },
    onFinish: async ({ responseMessage }) => {
      await kv.del(`chat:${chatId}:leaf`).catch((error) => {
        logger.error(
          {
            event: "kv-error",
            component: "api:chat",
            error: normalizeError(error),
          },
          "Failed to clear chat leaf in KV store"
        );

        // Let's don't break the flow just because of this
      });

      await db.insert(messagesTable).values({
        id: responseMessage.id,
        chatId,
        parentId: payload.message.id,
        parts: responseMessage.parts,
        role: responseMessage.role,
        metadata: {
          systemPrompt: systemPromptDefinition.id,
          model: textGenerationModel.modelId,
          usage: responseMessage.metadata?.usage,
        },
      });

      logger.debug(
        {
          systemPromptId: systemPromptDefinition.id,
          model: model.modelId,
          provider: model.provider,
        },
        "Metadata"
      );
    },
  });

  after(async () => {
    await db
      .update(chats)
      .set({ updatedAt: sql`now()` })
      .where(eq(chats.id, chatId));
  });

  return createUIMessageStreamResponse({
    stream: stream,
  });
}
