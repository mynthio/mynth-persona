import pino, { Logger } from "pino";
// Removed LanguageModelUsage import as we now accept any response

// Prevent tree-shaking
import "@axiomhq/pino";

import { LanguageModelResponseMetadata, LanguageModelUsage } from "ai";

const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

export const logger: Logger = isProduction
  ? pino({ level: "info" })
  : pino({
      level: "debug",
    });

export function logAiSdkUsage(
  response: {
    usage: LanguageModelUsage;
    response: LanguageModelResponseMetadata;
  },
  params: {
    component: string;
    useCase: string;
    provider?: string;
  }
): void {
  const { component, useCase, provider = "openrouter" } = params;

  const usage = response.usage;
  const modelId = response.response.modelId;

  logger.info({
    event: "text-generation-usage",
    component,
    use_case: useCase,
    ai_meta: { provider, model: modelId },
    attributes: {
      usage: {
        input_tokens: usage.inputTokens ?? 0,
        output_tokens: usage.outputTokens ?? 0,
        total_tokens: usage.totalTokens ?? 0,
        reasoning_tokens: usage.reasoningTokens ?? 0,
        cached_input_tokens: usage.cachedInputTokens ?? 0,
      },
    },
  });

  logger.flush();
}
