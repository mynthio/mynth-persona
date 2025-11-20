import "server-only";

import { Ratelimit } from "@unkey/ratelimit";
import { type PlanId } from "@/config/shared/plans";

const ROOT_KEY = process.env.UNKEY_ROOT_KEY;

if (!ROOT_KEY) {
  throw new Error("UNKEY_ROOT_KEY is required");
}

export const PersonaCreatorUnauthenticatedRateLimit = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "persona.creator.unauthenticated",
  limit: 10,
  duration: "1h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

export const PersonaCreatorAuthenticatedRateLimit = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "persona.creator.authenticated",
  limit: 100,
  duration: "1h",
  onError: () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
});

export const ScenarioPublishRateLimit = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "scenario.publish",
  limit: 5,
  duration: "1h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

// Global eco tier rate limiter - shared across all plans
export const EcoChatRateLimit = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "chat.models.eco",
  limit: 100,
  duration: "2h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

const FreeChatRateLimitStandardModels = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "chat.plan.free.models.standard",
  limit: 20,
  duration: "2h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

const SparkChatRateLimitStandardModels = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "chat.plan.spark.models.standard",
  limit: 120,
  duration: "2h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

const SparkChatRateLimitPremiumModels = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "chat.plan.spark.models.premium",
  limit: 20,
  duration: "2h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

const FlameChatRateLimitStandardModels = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "chat.plan.flame.models.standard",
  limit: 180,
  duration: "2h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

const FlameChatRateLimitPremiumModels = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "chat.plan.flame.models.premium",
  limit: 80,
  duration: "2h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

const BlazeChatRateLimitStandardModels = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "chat.plan.blaze.models.standard",
  limit: 200,
  duration: "2h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

const BlazeChatRateLimitPremiumModels = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "chat.plan.blaze.models.premium",
  limit: 120,
  duration: "2h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

export const CHAT_RATE_LIMITS = {
  free: {
    standard: FreeChatRateLimitStandardModels,
    premium: null,
  },
  spark: {
    standard: SparkChatRateLimitStandardModels,
    premium: SparkChatRateLimitPremiumModels,
  },
  flame: {
    standard: FlameChatRateLimitStandardModels,
    premium: FlameChatRateLimitPremiumModels,
  },
  blaze: {
    standard: BlazeChatRateLimitStandardModels,
    premium: BlazeChatRateLimitPremiumModels,
  },
} as const;

export const rateLimitGuard = async (
  rateLimitter: Ratelimit,
  identifier: string,
  cost: number = 1
) => {
  // Use for testing
  // return {
  //   success: false,
  //   rateLimittedResponse: new Response(
  //     JSON.stringify({
  //       error: "rate_limit_exceeded" as const,

  //       limit: 10,
  //       remaining: 0,
  //       reset: 0,
  //     }),
  //     {
  //       status: 429,
  //     }
  //   ),
  // };

  if (process.env.NODE_ENV !== "production") return { success: true };

  const rateLimitResult = await rateLimitter.limit(identifier, { cost });

  if (!rateLimitResult.success) {
    return {
      success: false,
      rateLimittedResponse: new Response(
        JSON.stringify({
          error: "rate_limit_exceeded" as const,

          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        }),
        {
          status: 429,
        }
      ),
    };
  }

  return { success: true };
};
