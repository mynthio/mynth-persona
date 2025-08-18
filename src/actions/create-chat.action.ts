"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { chatPersonas, chats, personas, personaVersions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateObject } from "ai";
import { z } from "zod/v4";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import { chatConfig } from "@/config/shared/chat/chat-models.config";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import logsnag from "@/lib/logsnag";

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
    const openrouter = getOpenRouter();

    const model = openrouter("google/gemini-2.5-flash-lite", {
      models: [
        "mistralai/mistral-small-3.2-24b-instruct",
        "google/gemini-2.5-flash-lite-preview-06-17",
      ],
    });

    const timeStart = Date.now();

    try {
      const response = await generateObject({
        model,
        system:
          "Generate ultra-concise, token-efficient character details for role-play. Extract only from provided data; never add/invent. Omit age/name/gender. Use plain text, no fluff/emojis/formatting.",
        prompt: `Character: ${JSON.stringify(data)}`,
        schema: z.object({
          appearance: z
            .string()
            .describe(
              "Single comma-separated string of visual descriptors (e.g., slender athletic build, upright posture, oval face, high cheekbones)—include body type, skin tone/ethnicity, hair color/style, eyes, notable features, clothing/style; no articles/prepositions/sentences/trailing period; under 100 words."
            ),
          personality: z
            .string()
            .describe(
              "Concise description of traits, speaking style, quirks, and behaviors; semicolon-separated fragments; under 50 tokens."
            ),
          background: z
            .string()
            .describe(
              "Key history, relationships, and formative events; 1-2 short sentences or fragments; under 50 tokens."
            ),
          interests: z
            .string()
            .optional()
            .describe(
              "Optional: Hobbies, pursuits, or passions if present in data; comma-separated list; omit if not relevant; under 30 tokens."
            ),
          skills: z
            .string()
            .optional()
            .describe(
              "Optional: Abilities and knowledge domains if present; comma-separated list; omit if not relevant; under 30 tokens."
            ),
          motivations: z
            .string()
            .optional()
            .describe(
              "Optional: Goals, aspirations, motivations, and occupation if present; 1 short sentence or fragments; omit if not relevant; under 40 tokens."
            ),
        }),
      });

      logger.info({
        userId,
        event: "text-generation-usage",
        component: "generation:text:complete",
        use_case: "persona_roleplay_summary_generation",
        ai_meta: {
          provider: "openrouter",
          model: model.modelId,
        },
        attributes: {
          usage: {
            input_tokens: response.usage.inputTokens ?? 0,
            output_tokens: response.usage.outputTokens ?? 0,
            total_tokens: response.usage.totalTokens ?? 0,
            reasoning_tokens: response.usage.reasoningTokens ?? 0,
            cached_input_tokens: response.usage.cachedInputTokens ?? 0,
          },
        },
      });
      logger.flush();

      const {
        appearance,
        personality,
        background,
        interests,
        skills,
        motivations,
      } = response.object;

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
        model: response.response.modelId,
        data: response.object,
        timeMs: Date.now() - timeStart,
      });
    } catch (e) {
      await logsnag
        .track({
          channel: "personas",
          event: "persona-summary-failed",
          icon: "🚨",
          tags: { model: model.modelId },
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

    logger.info({
      userId,
      event: "text-generation-usage",
      component: "generation:text:complete",
      use_case: "chat_title_generation",
      ai_meta: {
        provider: "openrouter",
        model: model.modelId,
      },
      attributes: {
        usage: {
          input_tokens: titleResult.usage.inputTokens ?? 0,
          output_tokens: titleResult.usage.outputTokens ?? 0,
          total_tokens: titleResult.usage.totalTokens ?? 0,
          reasoning_tokens: titleResult.usage.reasoningTokens ?? 0,
          cached_input_tokens: titleResult.usage.cachedInputTokens ?? 0,
        },
      },
    });
    logger.flush();

    title = titleResult.object.title;
  } catch (e) {
    console.log(e);
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
