import "server-only";

import { Ratelimit } from "@unkey/ratelimit";

const ROOT_KEY = process.env.UNKEY_ROOT_KEY;

if (!ROOT_KEY) {
  throw new Error("UNKEY_ROOT_KEY is required");
}

export const GeneratePersonaUnauthenticatedRatelimit = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "persona.generate.unauthenticated",
  limit: 10,
  duration: "1h",
  onError: () => ({ success: false, limit: 0, remaining: 0, reset: 0 }),
});

export const GeneratePersonaAuthenticatedRatelimit = new Ratelimit({
  rootKey: ROOT_KEY,
  namespace: "persona.generate.authenticated",
  limit: 100,
  duration: "1h",
  onError: () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
});
