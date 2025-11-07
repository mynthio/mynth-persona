import "server-only";

import { kv } from "@vercel/kv";
import { type PlanId } from "@/config/shared/plans";
import { CONCURRENT_IMAGE_JOBS_PER_PLAN } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const KEY_PREFIX = "concurrent:image:jobs";
const TTL_SECONDS = 600; // 10 minutes

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
  const key = getJobCountKey(userId);
  const limit = CONCURRENT_IMAGE_JOBS_PER_PLAN[planId];

  try {
    // Atomically increment the counter
    const newCount = await kv.incr(key);
    await kv.expire(key, TTL_SECONDS);

    // Check if limit exceeded
    if (newCount > limit) {
      // Immediately decrement since we exceeded the limit
      await kv.decr(key);

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
    const currentCount = await kv.get<number>(key);

    // Only decrement if counter exists and is > 0
    if (currentCount && currentCount > 0) {
      await kv.decr(key);

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

/**
 * Gets the current concurrent job count for a user.
 * Useful for debugging and monitoring.
 *
 * @param userId - The user ID to check
 * @returns Current job count (0 if key doesn't exist)
 */
export const getConcurrentImageJobCount = async (
  userId: string
): Promise<number> => {
  const key = getJobCountKey(userId);

  try {
    const count = await kv.get<number>(key);
    return count ?? 0;
  } catch (error) {
    logger.error(
      {
        error,
        userId,
      },
      "Failed to get concurrent image job count"
    );
    return 0;
  }
};

/**
 * Resets the concurrent job counter for a user.
 * Useful for admin/support operations.
 *
 * @param userId - The user ID to reset
 */
export const resetConcurrentImageJobCount = async (
  userId: string
): Promise<void> => {
  const key = getJobCountKey(userId);

  try {
    await kv.del(key);
    logger.debug({ userId }, "Concurrent image job counter reset");
  } catch (error) {
    logger.error(
      {
        error,
        userId,
      },
      "Failed to reset concurrent image job counter"
    );
  }
};
