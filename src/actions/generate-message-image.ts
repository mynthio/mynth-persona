"use server";

import { auth } from "@clerk/nextjs/server";
import "server-only";
import { tasks } from "@trigger.dev/sdk";
import { db } from "@/db/drizzle";
import { chats, messages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateMessageImageTask } from "@/trigger/generate-message-image.task";
import { getUserPlan } from "@/services/auth/user-plan.service";
import { PlanId } from "@/config/shared/plans";
import {
  IMAGE_GENERATIONS_RATE_LIMITERS,
  imageRateLimitGuard,
} from "@/lib/rate-limit-image";
import {
  ImageModelId,
  getModelCost,
  IMAGE_MODELS,
  supportsReferenceImages,
  DEFAULT_IMAGE_MODEL_ID,
} from "@/config/shared/image-models";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import { incrementConcurrentImageJob } from "@/lib/concurrent-image-jobs";

export type ImageGenerationMode = "character" | "creative";

type GenerateMessageImageOptions = {
  modelId?: ImageModelId;
  mode?: ImageGenerationMode;
};

export const generateMessageImage = async (
  messageId: string,
  chatId: string,
  options?: GenerateMessageImageOptions
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get mode and modelId from options
  const mode = options?.mode || "character";
  const modelId = options?.modelId || DEFAULT_IMAGE_MODEL_ID;

  // Validate modelId
  if (!(modelId in IMAGE_MODELS)) {
    throw new Error("INVALID_MODEL_ID");
  }

  // Verify chat ownership
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // Character mode validation
  if (mode === "character") {
    // Check if model supports reference images
    if (!supportsReferenceImages(modelId)) {
      throw new Error("MODEL_DOES_NOT_SUPPORT_REFERENCE_IMAGES");
    }

    // Check if scene image exists
    const chatSettings = chat.settings as ChatSettings | null;
    if (!chatSettings?.sceneImageMediaId) {
      throw new Error("SCENE_IMAGE_REQUIRED");
    }
  }

  // Verify message exists in chat
  const message = await db.query.messages.findFirst({
    where: and(eq(messages.id, messageId), eq(messages.chatId, chatId)),
  });

  if (!message) {
    throw new Error("Message not found");
  }

  const planId = await getUserPlan();

  // Check concurrent job limit using KV store
  const concurrentJobResult = await incrementConcurrentImageJob(
    userId,
    planId as PlanId
  );
  if (!concurrentJobResult.success) {
    throw concurrentJobResult.error;
  }

  // Calculate cost based on model
  const cost = getModelCost(modelId);

  const rateLimiter = IMAGE_GENERATIONS_RATE_LIMITERS[planId as PlanId];

  const rateLimitResult = await imageRateLimitGuard(rateLimiter, userId, cost);
  if (!rateLimitResult.success) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  const taskHandle = await tasks.trigger<typeof generateMessageImageTask>(
    "generate-message-image",
    {
      messageId,
      chatId,
      userId,
      modelId,
      mode,
      cost,
      planId,
    },
    {
      tags: [`user:${userId}`, `chat:${chatId}`, `message:${messageId}`],
    }
  );

  return {
    runId: taskHandle.id,
    publicAccessToken: taskHandle.publicAccessToken,
    cost,
  };
};
