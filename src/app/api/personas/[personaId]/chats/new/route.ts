import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { logger, logAiSdkUsage } from "@/lib/logger";
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
      logAiSdkUsage(finalData, {
        component: "generation:text:complete",
        useCase: "persona_chat_message_generation",
      });

    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "X-Chat-Id": "TEST",
    },
  });
}
