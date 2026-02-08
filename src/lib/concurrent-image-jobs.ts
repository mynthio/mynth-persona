import "server-only";

import { redis } from "@/lib/redis";
import { type PlanId } from "@/config/shared/plans";

import { logger } from "@/lib/logger";

const KEY_PREFIX = "concurrent:image:jobs";
const TTL_SECONDS = 600; // 10 minutes

const CONCURRENT_IMAGE_JOBS_PER_PLAN: Record<PlanId, number> = {
  free: 1,
  spark: 1,
  flame: 2,
  blaze: 2,
};

/**
 * Generates the Redis key for tracking concurrent image jobs
 */
const getJobCountKey = (userId: string): string => {
  return `${KEY_PREFIX}:${userId}`;
};

export type ConcurrentJobCheckResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: Error;
    };

/**
 * Atomically increments the concurrent job counter and checks if limit is exceeded.
 * Uses Redis INCR for atomic operation and sets TTL to auto-cleanup stale counters.
 *
 * @param userId - The user ID to track jobs for
 * @param planId - The user's plan ID to determine limits
 * @returns Result with throwable error if limit exceeded
 *
 * @example
 * ```typescript
 * const result = await incrementConcurrentImageJob(userId, planId);
 * if (!result.success) {
 *   throw result.error;
 * }
 * ```
 */
export const incrementConcurrentImageJob = async (
  userId: string,
  planId: PlanId
): Promise<ConcurrentJobCheckResult> => {
  // Check if user is whitelisted
  const whitelistedUserIds =
    process.env.IMAGE_RATE_LIMIT_WHITELIST_USER_IDS?.split(",").map((id) =>
      id.trim()
    ) || [];
  if (whitelistedUserIds.includes(userId)) {
    return { success: true };
  }

  const key = getJobCountKey(userId);
  const limit = CONCURRENT_IMAGE_JOBS_PER_PLAN[planId];

  try {
    // Atomically increment the counter
    const newCount = await redis.incr(key);
    await redis.expire(key, TTL_SECONDS);

    // Check if limit exceeded
    if (newCount > limit) {
      // Immediately decrement since we exceeded the limit
      await redis.decr(key);

      return {
        success: false,
        error: new Error("CONCURRENT_LIMIT_EXCEEDED"),
      };
    }

    logger.debug(
      {
        userId,
        planId,
        limit,
        current: newCount,
      },
      "Concurrent image job incremented"
    );

    return { success: true };
  } catch (error) {
    logger.error(
      {
        error,
        userId,
        planId,
      },
      "Failed to increment concurrent image job counter"
    );
    // On error, fail open to avoid blocking users
    return { success: true };
  }
};

/**
 * Atomically decrements the concurrent job counter.
 * Should be called when a job completes (success or failure).
 *
 * @param userId - The user ID to decrement jobs for
 */
export const decrementConcurrentImageJob = async (
  userId: string
): Promise<void> => {
  const key = getJobCountKey(userId);

  try {
    const currentCount = await redis.get<number>(key);

    // Only decrement if counter exists and is > 0
    if (currentCount && currentCount > 0) {
      await redis.decr(key);

      logger.debug(
        {
          userId,
          newCount: currentCount - 1,
        },
        "Concurrent image job decremented"
      );
    }
  } catch (error) {
    logger.error(
      {
        error,
        userId,
      },
      "Failed to decrement concurrent image job counter"
    );
    // Don't throw - decrementing is best effort
  }
};
