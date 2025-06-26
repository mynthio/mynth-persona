import { LanguageModelV1, streamObject, StreamObjectResult } from "ai";
import { TextGenerationBase } from "../text-generation-base";
import { TextGenerationStreamObjectOptions } from "../types/text-generation-stream-object-options.type";
import { google } from "@ai-sdk/google";
import { ZodSchema } from "zod";

export abstract class GoogleTextGenerationBase extends TextGenerationBase {
  public readonly modelId: string;

  private readonly model: LanguageModelV1;

  constructor(modelId: string) {
    super();

    this.modelId = modelId;

    this.model = google(modelId);
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
      onFinish: options.onFinish,
      onError: options.onError,
    });
  }
}
