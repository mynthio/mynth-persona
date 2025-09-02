"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { chatPersonas, chats, personas, personaVersions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateObject } from "ai";
import { z } from "zod/v4";
import { logger, logAiSdkUsage } from "@/lib/logger";
import { nanoid } from "nanoid";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import { chatConfig } from "@/config/shared/chat/chat-models.config";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import logsnag from "@/lib/logsnag";
import { generateRoleplaySummary } from "@/services/persona/roleplay-summary.service";

const chatModeSchema = z.enum(["roleplay", "story"]);

export const createChat = async (
  personaId: string,
  userMessage: string,
  mode: "roleplay" | "story" = "roleplay",
  modelId?: string
) => {
  // Validate mode parameter
  const validatedMode = chatModeSchema.parse(mode);
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorised");
  }

  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.id, personaId), eq(personas.userId, userId)),

    columns: {
      id: true,
    },

    with: {
      currentVersion: {
        columns: {
          id: true,
          roleplayData: true,
          data: true,
        },
      },
    },
  });

  if (!persona) {
    throw new Error("Persona not found");
  }

  if (!persona.currentVersion) {
    throw new Error("Persona Version not found");
  }

  const { roleplayData: maybeRoleplayData, data } =
    persona.currentVersion || {};

  if (!data) {
    throw new Error("Persona Version Invalid");
  }

  let roleplayData = maybeRoleplayData;

  if (!roleplayData) {
    const timeStart = Date.now();

    try {
      const { summary, modelId } = await generateRoleplaySummary(data);

      const {
        appearance,
        personality,
        background,
        interests,
        skills,
        motivations,
      } = summary;

      await db
        .update(personaVersions)
        .set({
          roleplayData: {
            // @ts-ignore
            name: data.name as string,
            // @ts-ignore
            age: data.age as string,
            // @ts-ignore
            gender: data.gender as string,
            appearance,
            personality,
            background,
            interests,
            skills,
            motivations,
          },
        })
        .where(eq(personaVersions.id, persona.currentVersion!.id));

      logger.debug({
        model: modelId,
        data: summary,
        timeMs: Date.now() - timeStart,
      });
    } catch (e) {
      await logsnag
        .track({
          channel: "personas",
          event: "persona-summary-failed",
          icon: "🚨",
        })
        .catch(() => {});
      throw e;
    }
  }

  const chatId = `pch_${nanoid()}`;

  const openrouter = getOpenRouter();
  const model = openrouter("openai/gpt-oss-20b:free", {
    models: ["openai/gpt-oss-20b"],
  });

  let title: string;
  try {
    const titleResult = await generateObject({
      model,
      system:
        "Generate a title for a chat based on User's first message and role-play character summary",
      prompt: `Character: ${(data as any).summary}
    
    User message: ${userMessage}`,
      schema: z.object({
        title: z
          .string()
          .describe(
            "Short, one sentence, maximum 100 characters title for a chat"
          ),
      }),
    });

    logAiSdkUsage(titleResult, {
      component: "generation:text:complete",
      useCase: "chat_title_generation",
    });

    title = titleResult.object.title;
  } catch (e) {
    title = "Untitled Chat";
  }

  // Resolve and validate the chat model to use
  const availableModels = chatConfig.models;
  if (!availableModels || availableModels.length === 0) {
    throw new Error("No chat models configured");
  }

  let selectedModelId: TextGenerationModelId;
  if (modelId) {
    const found = availableModels.find((m) => m.modelId === modelId);
    if (!found) {
      throw new Error("Chat model not found");
    }
    selectedModelId = found.modelId;
  } else {
    selectedModelId = availableModels[0].modelId;
  }

  const newChat = {
    id: chatId,
    personaId,
    personaVersionId: persona.currentVersion.id,
    userId,
    mode: validatedMode,
    settings: {
      model: selectedModelId,
    } satisfies ChatSettings,
    title: title || "New Chat",
  };

  await db.transaction(async (tx) => {
    await tx.insert(chats).values({
      id: chatId,
      userId,
      mode: validatedMode,
      settings: newChat.settings,
      title: title || "New Chat",
    });

    await tx.insert(chatPersonas).values({
      chatId,
      personaId,
      personaVersionId: persona.currentVersion!.id!,
    });
  });

  await logsnag
    .track({
      channel: "chats",
      event: "chat-created",
      icon: "💬",
      tags: { model: selectedModelId },
    })
    .catch(() => {});

  return newChat;
};
