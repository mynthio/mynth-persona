import "server-only";

import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger, logAiSdkUsage } from "@/lib/logger";
import {
  streamText,
  convertToModelMessages,
  smoothStream,
  createUIMessageStreamResponse,
  createUIMessageStream,
  ModelMessage,
} from "ai";
import { nanoid } from "nanoid";
import { db } from "@/db/drizzle";
import { eq, sql } from "drizzle-orm";
import { chats, messages as messagesTable } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { getDefaultPromptDefinitionForMode } from "@/lib/prompts/registry";
import { getSystemPromptRendererForRoleplay } from "@/lib/prompts/roleplay";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import { trackChatError } from "@/lib/logsnag";
import { revalidateTag } from "next/cache";
import { notFound } from "next/navigation";
import { after } from "next/server";
import {
  PersonaUIMessage,
  PersonaUIMessageMetadata,
} from "@/schemas/shared/messages/persona-ui-message.schema";
import {
  messageEventPayloadSchema,
  PersonaVersionRoleplayData,
} from "@/schemas";
import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";
import { getChatByIdForUserCached } from "@/data/chats/get-chat.data";
import { replacePlaceholders } from "@/lib/replace-placeholders";

import { redis } from "@/lib/redis";
import ms from "ms";
import { getUserPlan } from "@/services/auth/user-plan.service";
import { generateChatTitle } from "@/services/chat/generate-chat-title";
import { generateCheckpointSummary } from "@/services/chat/generate-checkpoint-summary";
import { extractPersonaMessageText } from "@/lib/utils";
import {
  selectTextGenerationModel,
  checkPremiumModelAccess,
  checkChatRateLimit,
} from "@/services/chat/chat-utils.service";

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

  const planId = await getUserPlan();

  /**
   * PAYLOAD
   */
  const { chatId } = await ctx.params;
  const payload = await req.json().then(messageEventPayloadSchema.parseAsync);
  const parentId = payload.parentId;

  console.log(JSON.stringify({ payload }, null, 2));

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

  // Resolve author note: payload takes priority, fall back to persisted value
  const authorNote = payload.authorNote ?? chatSettings.author_note ?? null;

  // Placeholder replacement context
  const userName = chatSettings.user_persona?.name;
  const personaName = roleplayData.name;

  /**
   * TEXT GENERATION MODEL
   * Priority: payload.modelId → chatSettings.model → DEFAULT_CHAT_MODEL
   * Falls back if payload model is invalid
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
   */
  const messagesHistory = parentId
    ? await getChatMessagesData(chatId, {
        messageId: parentId,
        limit: 50,
        strict: true,
      }).then((res) => res.messages)
    : [];
  const lastMessage = messagesHistory.at(-1);

  const checkPoints = messagesHistory
    .filter((message) => !!message.metadata?.checkpoint?.content)
    .map((message) => message.metadata?.checkpoint?.content);

  const [lastCheckpointContent, previousCheckpointContent] = [
    checkPoints.at(-1),
    checkPoints.at(-2),
  ];

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

  const shouldGenerateCheckpoint =
    (payload.event === "send" || payload.event === "edit_message") &&
    messagesAfterCheckpointCount > 24;

  const indexOfCheckpointToUse =
    messagesAfterCheckpointCount > 24
      ? lastCheckpointIndex
      : previousCheckpointIndex;

  const checkpointContentToUse = indexOfCheckpointToUse
    ? messagesHistory.at(indexOfCheckpointToUse)?.metadata?.checkpoint?.content
    : undefined;

  // logger.debug(
  //   {
  //     lastCheckpointIndex,
  //     previousCheckpointIndex,
  //     messagesAfterCheckpointCount,
  //     shouldGenerateCheckpoint,
  //     indexOfCheckpointToUse,
  //     checkpointContentToUse,
  //   },
  //   "Last Checkpoint"
  // );

  // Validation for message events based on history
  if (payload.event === "send") {
    // When sending a new message, last message must not be a user message
    if (lastMessage?.role === "user") {
      throw new Error(
        "Invalid Message and Event: Cannot send when last message is user"
      );
    }
  }

  if (payload.event === "regenerate") {
    // When regenerating, last message must not be a user message
    // Exception: root assistant message regeneration (empty history is allowed)
    if (messagesHistory.length > 0 && lastMessage?.role === "user") {
      throw new Error(
        "Invalid Message and Event: Cannot regenerate when last message is user"
      );
    }
  }

  /**
   * Insert user message into database with placeholder replacement
   */
  if (payload.event === "send" || payload.event === "edit_message") {
    // Replace placeholders in user message parts before saving
    const processedParts = payload.message.parts.map((part) => ({
      ...part,
      text: replacePlaceholders(part.text, { userName, personaName }),
    }));

    await db.insert(messagesTable).values({
      id: payload.message.id,
      parts: processedParts,
      role: "user",
      chatId,
      parentId: lastMessage?.id ?? null,
      ...(shouldGenerateCheckpoint
        ? {
            metadata: {
              checkpoint: {
                createdAt: new Date(),
              },
            },
          }
        : {}),
    });
  }

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

  logger.debug({ system }, "📢 System Prompt 📢");

  /**
   * MESSAGES
   * For root assistant message regeneration, we don't include a user message
   * (messagesHistory is empty AND no user message in payload - regenerating from system prompt only)
   */
  const isRootAssistantRegeneration =
    payload.event === "regenerate" &&
    messagesHistory.length === 0 &&
    !payload.message;

  const messagesTillCheckpoint = messagesHistory.slice(
    indexOfCheckpointToUse && indexOfCheckpointToUse > 0
      ? indexOfCheckpointToUse
      : 0
  );

  // console.log(JSON.stringify({ messagesTillCheckpoint }, null, 2));

  const messages = isRootAssistantRegeneration
    ? [
        {
          role: "system",
          content: `Please start the roleplay as ${personaName}`,
        } as ModelMessage,
      ]
    : await convertToModelMessages([
        ...messagesTillCheckpoint,
        ...(payload.message ? [payload.message] : []),
      ]);

  const newMessageId = `msg_${nanoid(32)}`;

  /**
   * STREAM
   */
  const stream = createUIMessageStream<PersonaUIMessage>({
    generateId: () => newMessageId,

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

          await redis.del(`chat:${chatId}:leaf`).catch((error) => {
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
          parentId: payload.message?.id ?? null,
          usage,
        },
      });
    },
    onFinish: async ({ responseMessage }) => {
      const cleanParts = responseMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => ({
          type: part.type,
          text: (part as { text: string }).text,
        }));

      await db.insert(messagesTable).values({
        id: responseMessage.id,
        chatId,
        parentId: payload.message?.id ?? null,
        parts: cleanParts,
        role: responseMessage.role,
        metadata: {
          model: textGenerationModel.modelId,
          usage: responseMessage.metadata?.usage,
        },
      });

      logger.debug(
        {
          chatMode: chat.mode,
          model: model.modelId,
          provider: model.provider,
        },
        "Metadata"
      );
    },
  });

  after(async () => {
    // Always update updatedAt, and persist model if it changed
    const shouldUpdateTitle = messagesHistory.length <= 2;

    const checkpointContent = shouldGenerateCheckpoint
      ? await generateCheckpointSummary({
          messagesSinceLastCheckpoint: [
            ...messagesHistory.slice(
              lastCheckpointIndex > 0 ? lastCheckpointIndex + 1 : 0
            ),
            ...(payload.message ? [payload.message] : []),
          ],
          lastCheckpointMessage:
            lastCheckpointIndex > 0
              ? messagesHistory[lastCheckpointIndex]
              : undefined,
          userName: userName ?? "User",
          personaName,
        })
      : undefined;

    const checkpointMetadata: PersonaUIMessageMetadata["checkpoint"] =
      checkpointContent
        ? {
            content: checkpointContent,
            // parentCheckpointMessageId: lastMessage?.id ?? null,
            createdAt: new Date(),
          }
        : undefined;

    if (checkpointContent && payload.message?.id) {
      await db
        .update(messagesTable)
        .set({
          metadata: sql`coalesce(${
            messagesTable.metadata
          }, '{}'::jsonb) || ${JSON.stringify({
            checkpoint: checkpointMetadata,
          })}::jsonb`,
        })
        .where(eq(messagesTable.id, payload.message.id));
    }

    const newTitle = shouldUpdateTitle
      ? await generateChatTitle(
          [...messagesHistory, ...(payload.message ? [payload.message] : [])],
          chatSettings.scenario?.scenario_text
        )
      : undefined;

    const shouldUpdateModel =
      resolvedModelId !== chatSettings.model || newTitle;
    const shouldUpdateAuthorNote =
      (authorNote ?? null) !== (chatSettings.author_note ?? null);
    const shouldUpdateSettings = shouldUpdateModel || shouldUpdateAuthorNote;

    logger.debug(
      {
        shouldUpdateTitle,
        newTitle,
        shouldUpdateModel,
        shouldUpdateAuthorNote,
        msgLength: `== ${messagesHistory.length}`,
      },
      "Should update title and model"
    );

    await redis.del(`chat:${chatId}:leaf`).catch((error) => {
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

    // Build settings patch: merge model and author_note changes
    const settingsPatch: Record<string, unknown> = {};
    if (shouldUpdateModel) {
      settingsPatch.model = resolvedModelId;
    }
    if (shouldUpdateAuthorNote) {
      settingsPatch.author_note = authorNote;
    }

    await db
      .update(chats)
      .set({
        updatedAt: sql`now()`,
        ...(newTitle && { title: newTitle }),
        ...(shouldUpdateSettings && {
          settings: sql`COALESCE(${
            chats.settings
          }, '{}'::jsonb) || ${JSON.stringify(settingsPatch)}::jsonb`,
        }),
      })
      .where(eq(chats.id, chatId));

    // Invalidate chat cache if settings were updated
    if (shouldUpdateSettings) {
      revalidateTag(`chat:${chatId}`, "max");
    }
  });

  return createUIMessageStreamResponse({
    stream: stream,
  });
}
