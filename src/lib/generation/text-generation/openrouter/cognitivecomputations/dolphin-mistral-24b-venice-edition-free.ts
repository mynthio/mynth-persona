import { ZodSchema } from "zod";
import { OpenRouterTextGenerationBase } from "../open-router-text-generation-base";
import { TextGenerationStreamObjectOptions } from "../../types/text-generation-stream-object-options.type";
import { streamObject } from "ai";
import ms from "ms";

export class OpenRouterCognitiveComputationsDolphinMistral24bVeniceEditionFree extends OpenRouterTextGenerationBase {
  static readonly ID =
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free" as const;

  constructor() {
    super(OpenRouterCognitiveComputationsDolphinMistral24bVeniceEditionFree.ID);
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
