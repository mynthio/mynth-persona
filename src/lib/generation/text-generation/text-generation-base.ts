import { streamObject, StreamObjectResult } from "ai";
import { TextGenerationStreamObjectOptions } from "./types/text-generation-stream-object-options.type";
import { ZodSchema } from "zod";

export abstract class TextGenerationBase {
  async streamObject<SchemaType = any>(
    schema: ZodSchema<SchemaType>,
    prompt: string,
    options: TextGenerationStreamObjectOptions
  ): Promise<StreamObjectResult<SchemaType, SchemaType, never>> {
    throw new Error("Not implemented");
  }
}
