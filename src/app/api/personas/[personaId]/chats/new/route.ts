import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import logsnag from "@/lib/logsnag";

export const maxDuration = 45;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const { userId } = await auth();

  const openrouter = getOpenRouter();
  const model = openrouter("mistralai/mistral-small-3.2-24b-instruct:free");

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
    onError: async (error) => {
      console.error(error);
      logger.error({
        event: "generation-error",
        component: "api:persona-chat:new",
        error: {
          message: (error as any)?.message ?? String(error),
          name: (error as any)?.name,
        },
      });
      await logsnag
        .track({
          channel: "chats",
          event: "chat-message-error",
          icon: "🚨",
          tags: { model: model.modelId },
        })
        .catch(() => {});
    },
    onFinish: async (finalData) => {
      logger.info({
        userId,
        event: "text-generation-usage",
        component: "generation:text:complete",
        use_case: "persona_chat_message_generation",
        ai_meta: { provider: "openrouter", model: model.modelId },
        attributes: {
          usage: {
            input_tokens: finalData.usage.inputTokens ?? 0,
            output_tokens: finalData.usage.outputTokens ?? 0,
            total_tokens: finalData.usage.totalTokens ?? 0,
            reasoning_tokens: finalData.usage.reasoningTokens ?? 0,
            cached_input_tokens: finalData.usage.cachedInputTokens ?? 0,
          },
        },
      });
      logger.flush();
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "X-Chat-Id": "TEST",
    },
  });
}
