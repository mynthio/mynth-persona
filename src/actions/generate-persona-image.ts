"use server";

import { auth } from "@clerk/nextjs/server";
import "server-only";
import { tasks } from "@trigger.dev/sdk";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { generatePersonaImageTask } from "@/trigger/generate-persona-image.task";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { PersonaWithVersion } from "@/types/persona.type";
import { logger } from "@/lib/logger";
import { getUserPlan } from "@/services/auth/user-plan.service";
import { PlanId } from "@/config/shared/plans";
import {
  IMAGE_GENERATIONS_RATE_LIMITERS,
  imageRateLimitGuard,
  BetaModelPersonaImageGenerationsRateLimit,
} from "@/lib/rate-limit-image";
import {
  ImageModelId,
  getModelCost,
  getImagesPerGeneration,
  isModelBeta,
} from "@/config/shared/image-models";
import { incrementConcurrentImageJob } from "@/lib/concurrent-image-jobs";
import { ActionResult } from "@/types/action-result.type";

type GeneratePersonaImageSettings = {
  modelId: ImageModelId;
  style: ImageStyle;
  shotType: ShotType;
  nsfw?: boolean;
  userNote?: string;
};

type GeneratePersonaImageResult = {
  taskId: string;
  publicAccessToken: string;
  cost: number;
  expectedImageCount: number;
};

export const generatePersonaImage = async (
  personaId: string,
  settings: GeneratePersonaImageSettings
): Promise<ActionResult<GeneratePersonaImageResult>> => {
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
  const cost = getModelCost(settings.modelId);

  // Use beta rate limiter if model is beta, otherwise use plan-based rate limiter
  const rateLimiter = isModelBeta(settings.modelId)
    ? BetaModelPersonaImageGenerationsRateLimit
    : IMAGE_GENERATIONS_RATE_LIMITERS[planId as PlanId];

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

  const persona = await db.query.personas.findFirst({
    where: and(
      eq(personas.id, personaId),
      eq(personas.userId, userId),
      ne(personas.visibility, "deleted")
    ),
    with: {
      currentVersion: true,
    },
  });

  if (!persona) {
    return {
      success: false,
      error: {
        code: "PERSONA_NOT_FOUND",
        message: "Persona not found",
      },
    };
  }

  if (!persona.currentVersion) {
    return {
      success: false,
      error: {
        code: "NO_CURRENT_VERSION",
        message: "Persona has no current version",
      },
    };
  }

  const taskHandle = await tasks.trigger<typeof generatePersonaImageTask>(
    "generate-persona-image",
    {
      persona: {
        ...persona,
        version: persona.currentVersion as PersonaWithVersion["version"],
      },
      userId,

      modelId: settings.modelId,
      style: settings.style,
      shotType: settings.shotType,
      nsfw: settings.nsfw || false,
      userNote: settings.userNote || "",
      cost,
      planId,
    },
    {
      tags: [`user:${userId}`],
    }
  );

  const expectedImageCount = getImagesPerGeneration(settings.modelId);

  return {
    success: true,
    data: {
      taskId: taskHandle.id,
      publicAccessToken: taskHandle.publicAccessToken,
      cost,
      expectedImageCount,
    },
  };
};
