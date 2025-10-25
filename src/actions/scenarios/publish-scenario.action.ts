"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { scenarios } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import {
  publishScenarioPayloadSchema,
  type PublishScenarioPayload,
} from "@/schemas/backend";
import { ScenarioPublishRateLimit, rateLimitGuard } from "@/lib/rate-limit";
import { logger, tasks } from "@trigger.dev/sdk";
import { publishScenarioTask } from "@/trigger/publish-scenario.task";

/**
 * Publishes a scenario to the public catalog
 *
 * @param payload - The publish scenario data (scenarioId, title, description, anonymous, aiGenerate)
 * @returns Success status with pending state
 * @throws Error if user is not authenticated, validation fails, or scenario is in invalid state
 */
export async function publishScenarioAction(payload: PublishScenarioPayload) {
  // 1. Authenticate user
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // 2. Rate limiting - 5 publishes per hour
  const rateLimitResult = await rateLimitGuard(
    ScenarioPublishRateLimit,
    userId
  );

  if (!rateLimitResult.success) {
    throw new Error(
      "You have exceeded the scenario publish rate limit. Please try again later."
    );
  }

  // 3. Validate input payload
  const validatedData = await publishScenarioPayloadSchema.parseAsync(payload);

  // 4. Fetch scenario and validate ownership + state
  const scenario = await db.query.scenarios.findFirst({
    where: and(
      eq(scenarios.id, validatedData.scenarioId),
      eq(scenarios.creatorId, userId)
    ),
    columns: {
      id: true,
      visibility: true,
      publishStatus: true,
      creatorId: true,
    },
  });

  if (!scenario) {
    throw new Error("Scenario not found or you don't have permission to publish it");
  }

  // 5. Check if scenario belongs to user (double-check)
  if (scenario.creatorId !== userId) {
    throw new Error("You don't have permission to publish this scenario");
  }

  // 6. Check if scenario is flagged for content moderation
  if (scenario.publishStatus === "flagged") {
    throw new Error(
      "This scenario has been flagged for inappropriate content and cannot be published. Please contact support for manual review."
    );
  }

  // 7. Check if scenario is currently publishing
  if (scenario.publishStatus === "pending") {
    throw new Error("Publish already in progress");
  }

  // 8. Prevent publishing if already public
  if (scenario.visibility === "public") {
    throw new Error("Scenario is already published");
  }

  // 9. Mark publish attempt as pending
  await db
    .update(scenarios)
    .set({
      publishStatus: "pending",
      lastPublishAttempt: {
        status: "pending",
        attemptedAt: new Date().toISOString(),
      },
    })
    .where(eq(scenarios.id, validatedData.scenarioId));

  // 10. Trigger background job for publish task
  const taskHandle = await tasks.trigger<typeof publishScenarioTask>(
    "publish-scenario",
    {
      scenarioId: validatedData.scenarioId,
      publishData: {
        title: validatedData.title,
        description: validatedData.description,
        anonymous: validatedData.anonymous,
        aiGenerate: validatedData.aiGenerate,
      },
    },
    {
      // idempotencyKey: `publish-scenario-${validatedData.scenarioId}`,
      concurrencyKey: userId,
    }
  );

  console.log(taskHandle);


  return {
    success: true,
    status: "pending" as const,
    taskId: taskHandle.id,
    publicAccessToken: taskHandle.publicAccessToken,
  };
}
