import "server-only";

import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { logger } from "@/lib/logger";

const REDIS_URL = process.env.REDIS_URL;

const redisClient = new Redis(REDIS_URL!, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

// TTS rate limiter: 10 requests per 4 hours for all plans
const TtsRateLimit = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rate-limit:tts",
  points: 10,
  duration: 14400, // 4 hours in seconds
});

/**
 * Checks TTS rate limit for the given identifier (userId).
 * Returns true if allowed, false if rate limited.
 */
export const ttsRateLimitGuard = async (
  identifier: string,
): Promise<boolean> => {
  // Check if user is whitelisted
  const whitelistedUserIds =
    process.env.RATE_LIMIT_WHITELIST_USER_IDS?.split(",").map((id) =>
      id.trim(),
    ) || [];
  if (whitelistedUserIds.includes(identifier)) {
    return true;
  }

  // Skip rate limiting in non-production environments
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  try {
    await TtsRateLimit.consume(identifier);
    return true;
  } catch {
    return false;
  }
};

/**
 * Restores a rate limit point back to the user.
 * Use when an operation fails and you want to refund the consumed point.
 */
export const ttsRateLimitRestore = async (
  identifier: string,
): Promise<void> => {
  try {
    await TtsRateLimit.reward(identifier, 1);
  } catch (error) {
    logger.error(
      { error, identifier },
      "Failed to restore TTS rate limit point",
    );
  }
};
