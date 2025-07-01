import { LanguageModelV1, streamObject, StreamObjectResult } from "ai";
import { TextGenerationBase } from "../text-generation-base";
import { TextGenerationStreamObjectOptions } from "../types/text-generation-stream-object-options.type";
import { google } from "@ai-sdk/google";
import { ZodSchema } from "zod";
import { ModelId } from "../types/model-id.type";

export abstract class GoogleTextGenerationBase extends TextGenerationBase {
  private readonly model: LanguageModelV1;

  constructor(modelId: ModelId, googleModelId: string) {
    super(modelId);

    this.model = google(googleModelId);
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
      onFinish: options.onFinish,
      onError: options.onError,
    });
  }
}
