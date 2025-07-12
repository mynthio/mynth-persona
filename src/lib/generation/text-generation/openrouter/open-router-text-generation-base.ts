import { LanguageModelV1, streamObject } from "ai";
import { TextGenerationBase } from "../text-generation-base";
import { TextGenerationStreamObjectOptions } from "../types/text-generation-stream-object-options.type";
import { ZodSchema } from "zod";
import {
  createOpenRouter,
  OpenRouterProvider,
} from "@openrouter/ai-sdk-provider";
import { ModelId } from "../types/model-id.type";
import ms from "ms";

export abstract class OpenRouterTextGenerationBase extends TextGenerationBase {
  private readonly openRouter: OpenRouterProvider;

  protected readonly model: LanguageModelV1;

  constructor(modelId: ModelId) {
    super(modelId);

    this.openRouter = createOpenRouter({
      apiKey: process.env.OPEN_ROUTER_API_KEY!,
    });

    this.model = this.openRouter(modelId);
  }

  async streamObject(
    schema: ZodSchema,
    prompt: string,
    options: TextGenerationStreamObjectOptions
  ) {
    return streamObject({
      model: this.model,
      system: options.systemPrompt,
      prompt,
      schema,
      maxTokens: 1500,
      abortSignal: AbortSignal.timeout(ms("60s")),
      onFinish: options.onFinish,
      onError: options.onError,
    });
  }
}
