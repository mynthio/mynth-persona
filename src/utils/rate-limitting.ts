import "server-only";

import { Ratelimit } from "@unkey/ratelimit";

export const personaAnonymousGenerateRatelimit = new Ratelimit({
  rootKey: process.env.UNKEY_ROOT_KEY!,
  namespace: "persona.anonymous.generate",
  limit: 5,
  duration: "1d",
  onError: () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
});
