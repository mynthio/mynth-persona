"use server";

import { auth } from "@clerk/nextjs/server";
import "server-only";
import { tasks } from "@trigger.dev/sdk";
import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateChatSceneImageTask } from "@/trigger/generate-chat-scene-image.task";
import { getUserPlan } from "@/services/auth/user-plan.service";
import { PlanId } from "@/config/shared/plans";
import {
  IMAGE_GENERATIONS_RATE_LIMITERS,
  imageRateLimitGuard,
} from "@/lib/rate-limit-image";
import {
  DEFAULT_IMAGE_MODEL_ID,
  ImageModelId,
  getModelCost,
} from "@/config/shared/image-models";
import { incrementConcurrentImageJob } from "@/lib/concurrent-image-jobs";
import { ActionResult } from "@/types/action-result.type";

type GenerateChatSceneImageResult = {
  runId: string;
  publicAccessToken: string;
  cost: number;
};

export const generateChatSceneImage = async (
  chatId: string,
  modelId: ImageModelId = DEFAULT_IMAGE_MODEL_ID
): Promise<ActionResult<GenerateChatSceneImageResult>> => {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to generate images",
      },
    };
  }

  // Verify chat ownership
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
  });

  if (!chat) {
    return {
      success: false,
      error: {
        code: "CHAT_NOT_FOUND",
        message: "Chat not found",
      },
    };
  }

  const planId = await getUserPlan();

  // Check concurrent job limit using KV store
  const concurrentJobResult = await incrementConcurrentImageJob(
    userId,
    planId as PlanId
  );
  if (!concurrentJobResult.success) {
    return {
      success: false,
      error: {
        code: "CONCURRENT_LIMIT_EXCEEDED",
        message: "Concurrent generation limit reached",
      },
    };
  }

  // Calculate cost based on model
  const cost = getModelCost(modelId);

  const rateLimiter = IMAGE_GENERATIONS_RATE_LIMITERS[planId as PlanId];

  const rateLimitResult = await imageRateLimitGuard(rateLimiter, userId, cost);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Rate limit exceeded",
      },
    };
  }

  const taskHandle = await tasks.trigger<typeof generateChatSceneImageTask>(
    "generate-chat-scene-image",
    {
      chatId,
      userId,
      modelId,
      cost,
      planId,
    },
    {
      tags: [`user:${userId}`, `chat:${chatId}`],
    }
  );

  return {
    success: true,
    data: {
      runId: taskHandle.id,
      publicAccessToken: taskHandle.publicAccessToken,
      cost,
    },
  };
};
