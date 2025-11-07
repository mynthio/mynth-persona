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

export const generateChatSceneImage = async (
  chatId: string,
  modelId: ImageModelId = DEFAULT_IMAGE_MODEL_ID
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify chat ownership
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
  });

  if (!chat) {
    throw new Error("Chat not found");
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
    runId: taskHandle.id,
    publicAccessToken: taskHandle.publicAccessToken,
    cost,
  };
};
