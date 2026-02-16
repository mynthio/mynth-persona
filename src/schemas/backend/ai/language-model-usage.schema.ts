import { z } from "zod";

export const languageModelUsageSchema = z.object({
  inputTokens: z.number().or(z.undefined()),
  outputTokens: z.number().or(z.undefined()),
});

export type LanguageModelUsage = z.infer<typeof languageModelUsageSchema>;
