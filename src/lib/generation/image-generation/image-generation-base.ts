import { ZodSchema } from "zod";

export type ImageGenerationResult = {
  image: Buffer;
  revisedPrompt?: string;
};

export abstract class ImageGenerationBase {
  abstract generate(
    prompt: string,
    options?: {
      width?: number;
      height?: number;
      userId?: string;
    }
  ): Promise<ImageGenerationResult>;
}
