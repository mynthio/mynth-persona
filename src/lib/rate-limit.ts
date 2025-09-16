import "server-only";

import { Ratelimit } from "@unkey/ratelimit";

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

export const rateLimitGuard = async (
  rateLimitter: Ratelimit,
  identifier: string
) => {
  if (process.env.NODE_ENV !== "production") return { success: true };

  const rateLimitResult = await rateLimitter.limit(identifier);

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
