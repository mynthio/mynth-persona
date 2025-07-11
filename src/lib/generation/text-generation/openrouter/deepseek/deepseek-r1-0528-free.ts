import { ZodSchema } from "zod";
import { OpenRouterTextGenerationBase } from "../open-router-text-generation-base";
import { TextGenerationStreamObjectOptions } from "../../types/text-generation-stream-object-options.type";
import { streamObject } from "ai";
import ms from "ms";

export class OpenRouterDeepSeekR10528Free extends OpenRouterTextGenerationBase {
  static readonly ID = "deepseek/deepseek-r1-0528:free" as const;

  constructor() {
    super(OpenRouterDeepSeekR10528Free.ID);
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
      mode: "json",
      maxTokens: 1500,
      abortSignal: AbortSignal.timeout(ms("60s")),
      maxRetries: 0,
      onFinish: options.onFinish,
      onError: options.onError,
    });
  }
}
