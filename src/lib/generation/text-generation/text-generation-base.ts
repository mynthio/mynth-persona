import { streamObject, StreamObjectResult } from "ai";
import { TextGenerationStreamObjectOptions } from "./types/text-generation-stream-object-options.type";
import { ZodSchema } from "zod";
import { ModelId } from "./types/model-id.type";

export abstract class TextGenerationBase {
  public readonly modelId: ModelId;

  constructor(modelId: ModelId) {
    this.modelId = modelId;
  }

  async streamObject<SchemaType = any>(
    schema: ZodSchema<SchemaType>,
    prompt: string,
    options: TextGenerationStreamObjectOptions
  ): Promise<StreamObjectResult<SchemaType, SchemaType, never>> {
    throw new Error("Not implemented");
  }
}
