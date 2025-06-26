import { LanguageModelV1, streamObject, StreamObjectResult } from "ai";
import { TextGenerationBase } from "../text-generation-base";
import { TextGenerationStreamObjectOptions } from "../types/text-generation-stream-object-options.type";
import { google } from "@ai-sdk/google";
import { ZodSchema } from "zod";
import {
  createOpenRouter,
  OpenRouterProvider,
} from "@openrouter/ai-sdk-provider";

export abstract class OpenRouterTextGenerationBase extends TextGenerationBase {
  private readonly openRouter: OpenRouterProvider;

  public readonly modelId: string;

  protected readonly model: LanguageModelV1;

  constructor(modelId: string) {
    super();

    this.openRouter = createOpenRouter({
      apiKey: process.env.OPEN_ROUTER_API_KEY!,
    });

    this.modelId = modelId;

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
      onFinish: options.onFinish,
      onError: options.onError,
    });
  }
}
