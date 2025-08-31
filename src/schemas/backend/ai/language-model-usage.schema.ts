import { z } from "zod/v4";

export const languageModelUsageSchema = z.object({
  inputTokens: z.number().or(z.undefined()),
  outputTokens: z.number().or(z.undefined()),
  totalTokens: z.number().or(z.undefined()),
  reasoningTokens: z.number().optional(),
  cachedInputTokens: z.number().optional(),
});

export type LanguageModelUsage = z.infer<typeof languageModelUsageSchema>;
