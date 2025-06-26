import { ZodSchema } from "zod";
import { OpenRouterTextGenerationBase } from "../open-router-text-generation-base";
import { TextGenerationStreamObjectOptions } from "../../types/text-generation-stream-object-options.type";
import { streamObject } from "ai";

export class OpenRouterQwen25Vl32bInstructFree extends OpenRouterTextGenerationBase {
  static readonly ID = "qwen/qwen2.5-vl-32b-instruct:free" as const;

  constructor() {
    super("qwen/qwen2.5-vl-32b-instruct:free");
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
      onFinish: options.onFinish,
      onError: options.onError,
    });
  }
}
