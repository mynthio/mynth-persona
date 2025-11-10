import "server-only";

import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { type PlanId } from "@/config/shared/plans";
import { logger } from "@/lib/logger";
import ms from "ms";

const REDIS_URL = process.env.REDIS_URL;

// Create Redis client
const redisClient = new Redis(REDIS_URL!, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

// Rate limiter configurations for each plan
// free: 5 per day
const FreeImageGenerationsRateLimit = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rate-limit:image:plan:free",
  points: 5,
  duration: 86400, // 1 day in seconds
});

// spark: 10 per day
const SparkImageGenerationsRateLimit = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rate-limit:image:plan:spark",
  points: 10,
  duration: 86400, // 1 day in seconds
});

// flame: 30 per day
const FlameImageGenerationsRateLimit = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rate-limit:image:plan:flame",
  points: 30,
  duration: 86400, // 1 day in seconds
});

// blaze: 30 per hour
const BlazeImageGenerationsRateLimit = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rate-limit:image:plan:blaze",
  points: 30,
  duration: 3600, // 1 hour in seconds
});

// Temporary beta limit for message image generation: 30 credits per day for all plans
export const BetaMessageImageGenerationsRateLimit = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rate-limit:beta:message-image",
  points: 30,
  duration: ms("1 day") / 1000, // Convert ms to seconds
});

export const IMAGE_GENERATIONS_RATE_LIMITERS: Record<PlanId, RateLimiterRedis> =
  {
    free: FreeImageGenerationsRateLimit,
    spark: SparkImageGenerationsRateLimit,
    flame: FlameImageGenerationsRateLimit,
    blaze: BlazeImageGenerationsRateLimit,
  };

export type ImageRateLimitResult =
  | {
      success: true;
    }
  | {
      success: false;
      rateLimitedResponse: Response;
    };

export const imageRateLimitGuard = async (
  rateLimiter: RateLimiterRedis,
  identifier: string,
  cost: number = 1
): Promise<ImageRateLimitResult> => {
  // Check if user is whitelisted
  const whitelistedUserIds =
    process.env.IMAGE_RATE_LIMIT_WHITELIST_USER_IDS?.split(",").map((id) =>
      id.trim()
    ) || [];
  if (whitelistedUserIds.includes(identifier)) {
    return { success: true };
  }

  // Skip rate limiting in non-production environments
  // if (process.env.NODE_ENV !== "production") {
  //   return { success: true };
  // }

  try {
    await rateLimiter.consume(identifier, cost);
    return { success: true };
  } catch (error) {
    // Assume any error is a rate limit error
    const rateLimitError = error as {
      msBeforeNext: number;
      remainingPoints: number;
    };

    const resetTimestamp = Date.now() + (rateLimitError.msBeforeNext || 0);

    return {
      success: false,
      rateLimitedResponse: new Response(
        JSON.stringify({
          error: "rate_limit_exceeded" as const,
          limit: rateLimiter.points,
          remaining: Math.max(0, rateLimitError.remainingPoints || 0),
          reset: Math.floor(resetTimestamp / 1000), // Convert to seconds
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
          },
        }
      ),
    };
  }
};

export const getImageRateLimiterForPlan = (
  planId: PlanId
): RateLimiterRedis => {
  return IMAGE_GENERATIONS_RATE_LIMITERS[planId];
};

/**
 * Restores rate limit points back to the user
 * Use this when an operation fails and you want to refund the consumed points
 */
export const imageRateLimitRestore = async (
  rateLimiter: RateLimiterRedis,
  identifier: string,
  cost: number = 1
): Promise<void> => {
  // Skip in non-production environments
  // if (process.env.NODE_ENV !== "production") {
  //   return;
  // }

  try {
    await rateLimiter.reward(identifier, cost);
  } catch (error) {
    // Log error but don't throw - restoring points is best effort
    logger.error(
      { error, identifier, cost },
      "Failed to restore rate limit points"
    );
  }
};
