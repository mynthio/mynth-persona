import "server-only";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { logger, logAiSdkUsage } from "@/lib/logger";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  smoothStream,
  createUIMessageStreamResponse,
  createUIMessageStream,
} from "ai";
import { nanoid } from "nanoid";
import { db } from "@/db/drizzle";
import { and, eq, sql } from "drizzle-orm";
import { chats, messages as messagesTable } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { generateSceneImageDemoTask } from "@/trigger/generate-scene-image-demo.task";
import {
  getDefaultPromptDefinitionForMode,
  getPromptDefinitionById,
} from "@/lib/prompts/registry";
import logsnag from "@/lib/logsnag";
export const maxDuration = 45;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ personaId: string; chatId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    messages,
    regenerate,
    ...rest
  }: {
    messages: UIMessage[];
    parentId?: string | null;
    regenerate?: boolean;
    chatId?: string;
  } = await req.json();

  const chatIdFromParam = (await params).chatId;

  const chatId = chatIdFromParam === "new" ? rest.chatId : chatIdFromParam;

  if (!chatId) {
    throw new Error("Chat ID not found");
  }

  const parentId = rest.parentId || null;

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId!), eq(chats.userId, userId)),
    with: {
      chatPersonas: {
        columns: {
          settings: true,
        },
        with: {
          personaVersion: {
            columns: {
              roleplayData: true,
              personaId: true,
            },
          },
        },
      },
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // Currently we support only single persona chats. It's preparation for future multi-persona chats.
  const chatPersona = chat.chatPersonas[0];

  if (!chatPersona.personaVersion) {
    throw new Error("Persona version not found");
  }

  const { roleplayData } = chatPersona.personaVersion as any;

  if (!roleplayData) {
    throw new Error("Roleplay data not found");
  }

  const messageId = `msg_${nanoid()}`;

  const userMessage = messages[messages.length - 1];

  if (regenerate !== true) {
    await db.insert(messagesTable).values({
      id: userMessage.id,
      chatId: chatId!,
      parts: userMessage.parts,
      role: userMessage.role,
      parentId,
    });
  }

  const leafId = parentId;

  logger.debug({
    parentId,
    leafId,
  });

  const timeStart = Date.now();

  const messagesHistory = leafId
    ? await db
        .execute(
          sql<{
            id: string;
            parent_id: string | null;
            chat_id: string;
            role: string;
            parts: any;
            created_at: Date;
            updated_at: Date;
            depth: number;
          }>`
      with recursive thread as (
        select m.id, m.parent_id, m.chat_id, m.role, m.parts, m.created_at, m.updated_at, 1 as depth
        from messages m
        where m.id = ${leafId ?? "NULL"} and m.chat_id = ${chatId}
        union all
        select pm.id, pm.parent_id, pm.chat_id, pm.role, pm.parts, pm.created_at, pm.updated_at, thread.depth + 1
        from messages pm
        join thread on thread.parent_id = pm.id
      )
      select id, parent_id, chat_id, role, parts, created_at, updated_at, depth
      from thread
      order by depth desc
      limit 200;
    `
        )
        .then((queryResult) => (queryResult.rows ? queryResult.rows : []))
    : [];

  logger.debug({
    leafId,
    messagesHistory,
    timeInMs: Date.now() - timeStart,
  });

  const openrouter = getOpenRouter();
  const model = openrouter("openai/gpt-oss-20b:free", {
    models: ["cognitivecomputations/dolphin-mistral-24b-venice-edition"],
    extraBody: {
      transforms: ["middle-out"],
    },
  });

  const systemPromptDefinition = getDefaultPromptDefinitionForMode(
    "chat",
    chat.mode
  );
  if (!systemPromptDefinition) throw new Error("Ups!");

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const result = streamText({
        model,
        system: systemPromptDefinition?.render({
          character: roleplayData,
          user: (chat.settings as any)?.user ?? undefined,
        }),
        messages: convertToModelMessages(
          messagesHistory.length > 0
            ? [...(messagesHistory as any), userMessage]
            : [userMessage]
        ),
        experimental_transform: smoothStream({ chunking: "word" }),
        onError: async (error) => {
          console.error(error);
          logger.error({
            event: "generation-error",
            component: "api:persona-chat",
            error: {
              message: (error as any)?.message ?? String(error),
              name: (error as any)?.name,
            },
          });
          await logsnag
            .track({
              channel: "chats",
              event: "chat-message-error",
              icon: "🚨",
              tags: { model: model.modelId },
            })
            .catch(() => {});
        },

        onFinish: async (finalData) => {
          logAiSdkUsage(finalData, {
              component: "chat:persona_chat_message:complete",
              useCase: "persona_chat_message_generation",
            });
          const imageId = `img_${nanoid(32)}`;
          const taskHandle = await tasks.trigger<
            typeof generateSceneImageDemoTask
          >("generate-scene-image-demo", {
            userId,
            personaId: chat.chatPersonas[0].personaVersion.personaId,
            // @ts-ignore
            userMessage: userMessage.parts[0].text,
            messageId,
            characterAppearance: `Name: ${roleplayData.name} Age: ${roleplayData.age} Gender: ${roleplayData.gender}. Appearance: ${roleplayData.appearance}`,
            aiMessage: finalData.text,
            imageId,
          });

          writer.write({
            type: "file",
            url: imageId,
            mediaType: "image/webp",
          });

          writer.write({
            type: "message-metadata",
            messageMetadata: {
              modelId: finalData.response.modelId,
              usage: finalData.usage,
              publicToken: taskHandle.publicAccessToken,
              runId: taskHandle.id,
            },
          });
        },
      });

      writer.merge(
        result.toUIMessageStream({
          generateMessageId: () => messageId,
        })
      );
    },
    onFinish: async ({ responseMessage }) => {
      const meta = responseMessage.metadata as any;
      await db.insert(messagesTable).values({
        id: messageId,
        chatId,
        parentId: userMessage.id,
        parts: responseMessage.parts,
        role: responseMessage.role,
        metadata: {
          systemPrompt: systemPromptDefinition.id,
          model: meta?.modelId ?? model.modelId,
          provider: model.provider,
          usage: meta?.usage,
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

  return createUIMessageStreamResponse({
    stream: stream,
  });

  // return result.toUIMessageStreamResponse({
  //   generateMessageId: () => messageId,

  //   messageMetadata: ({ part }) => {
  //     // Send metadata when streaming starts
  //     if (part.type === "start") {
  //       return {
  //         createdAt: Date.now(),
  //         model: model.modelId,
  //       };
  //     }

  //     // Send additional metadata when streaming completes
  //     if (part.type === "finish") {
  //       return {
  //         cost: 1,
  //         imageId,
  //       };
  //     }
  //   },

  //   onFinish: async ({ messages }) => {
  //     const assistantMessage = messages[messages.length - 1];
  //     await db.insert(messagesTable).values({
  //       id: messageId,
  //       chatId,
  //       parentId: userMessage.id,
  //       parts: assistantMessage.parts,
  //       role: assistantMessage.role,
  //     });
  //   },
  // });
}
