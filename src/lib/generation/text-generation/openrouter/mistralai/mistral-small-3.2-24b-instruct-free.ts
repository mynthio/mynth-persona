import { ZodSchema } from "zod";
import { OpenRouterTextGenerationBase } from "../open-router-text-generation-base";
import { TextGenerationStreamObjectOptions } from "../../types/text-generation-stream-object-options.type";
import { streamObject } from "ai";

export class OpenRouterMistralSmall3224bInstructFree extends OpenRouterTextGenerationBase {
  static readonly ID = "mistralai/mistral-small-3.2-24b-instruct:free" as const;

  constructor() {
    super(OpenRouterMistralSmall3224bInstructFree.ID);
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
      onFinish: options.onFinish,
      onError: options.onError,
    });
  }
}
