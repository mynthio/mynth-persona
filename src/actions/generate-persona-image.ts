"use server";

import { auth } from "@clerk/nextjs/server";
import "server-only";
import { runs, tasks } from "@trigger.dev/sdk";
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
  CONCURRENT_IMAGE_JOBS_PER_PLAN,
  IMAGE_GENERATIONS_RATE_LIMITS,
  rateLimitGuard,
} from "@/lib/rate-limit";
import { ImageModelId, getModelCost } from "@/config/shared/image-models";

type GeneratePersonaImageSettings = {
  modelId: ImageModelId;
  style: ImageStyle;
  shotType: ShotType;
  nsfw?: boolean;
  userNote?: string;
};

export const generatePersonaImage = async (
  personaId: string,
  settings: GeneratePersonaImageSettings
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const runningJobs = await runs.list({
    status: ["EXECUTING", "WAITING", "PENDING_VERSION", "DELAYED", "QUEUED"],
    taskIdentifier: "generate-persona-image",
    tag: [`user:${userId}`],
  });

  logger.debug(
    {
      runningJobs,
    },
    "Running jobs 👟"
  );

  const planId = await getUserPlan();

  const concurrentImageJobsPerPlan =
    CONCURRENT_IMAGE_JOBS_PER_PLAN[planId as PlanId];

  if (runningJobs.data.length >= concurrentImageJobsPerPlan) {
    throw new Error("You have a job running already");
  }

  // Calculate cost based on model
  const cost = getModelCost(settings.modelId);

  const rateLimitter = IMAGE_GENERATIONS_RATE_LIMITS[planId as PlanId];

  const rateLimitResult = await rateLimitGuard(rateLimitter, userId, cost);
  if (!rateLimitResult.success) {
    throw new Error("Rate limit exceeded");
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
    throw new Error("Persona not found");
  }

  if (!persona.currentVersion) {
    throw new Error("Persona has no current version");
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
    },
    {
      tags: [`user:${userId}`],
    }
  );

  return {
    taskId: taskHandle.id,
    publicAccessToken: taskHandle.publicAccessToken,
    cost,
  };
};
