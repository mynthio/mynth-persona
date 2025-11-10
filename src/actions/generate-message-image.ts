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
  BetaMessageImageGenerationsRateLimit,
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
import { ActionResult } from "@/types/action-result.type";

export type ImageGenerationMode = "character" | "creative";

type GenerateMessageImageOptions = {
  modelId?: ImageModelId;
  mode?: ImageGenerationMode;
};

type GenerateMessageImageResult = {
  runId: string;
  publicAccessToken: string;
  cost: number;
};

export const generateMessageImage = async (
  messageId: string,
  chatId: string,
  options?: GenerateMessageImageOptions
): Promise<ActionResult<GenerateMessageImageResult>> => {
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

  // Get mode and modelId from options
  const mode = options?.mode || "character";
  const modelId = options?.modelId || DEFAULT_IMAGE_MODEL_ID;

  // Validate modelId
  if (!(modelId in IMAGE_MODELS)) {
    return {
      success: false,
      error: {
        code: "INVALID_MODEL_ID",
        message: "Invalid model ID",
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

  // Character mode validation
  if (mode === "character") {
    // Check if model supports reference images
    if (!supportsReferenceImages(modelId)) {
      return {
        success: false,
        error: {
          code: "MODEL_DOES_NOT_SUPPORT_REFERENCE_IMAGES",
          message: "Model does not support character mode",
        },
      };
    }

    // Check if scene image exists
    const chatSettings = chat.settings as ChatSettings | null;
    if (!chatSettings?.sceneImageMediaId) {
      return {
        success: false,
        error: {
          code: "SCENE_IMAGE_REQUIRED",
          message: "Scene image is required for character mode",
        },
      };
    }
  }

  // Verify message exists in chat
  const message = await db.query.messages.findFirst({
    where: and(eq(messages.id, messageId), eq(messages.chatId, chatId)),
  });

  if (!message) {
    return {
      success: false,
      error: {
        code: "MESSAGE_NOT_FOUND",
        message: "Message not found",
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

  // Use temporary beta rate limiter (30 credits/day for all plans)
  const rateLimitResult = await imageRateLimitGuard(
    BetaMessageImageGenerationsRateLimit,
    userId,
    cost
  );
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Rate limit exceeded",
      },
    };
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
    success: true,
    data: {
      runId: taskHandle.id,
      publicAccessToken: taskHandle.publicAccessToken,
      cost,
    },
  };
};
