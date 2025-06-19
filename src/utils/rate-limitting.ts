import { Ratelimit } from "@unkey/ratelimit";

export const personaAnonymousGenerateRatelimit = new Ratelimit({
  rootKey:
    process.env.NODE_ENV === "production" ? process.env.UNKEY_ROOT_KEY! : "",
  namespace: "persona:anonymous:generate",
  limit: 1,
  duration: "1d",
});
