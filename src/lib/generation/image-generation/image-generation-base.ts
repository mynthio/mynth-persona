import { ZodSchema } from "zod";

export type ImageGenerationResult = {
  image: Buffer;
  revisedPrompt?: string;
};

export abstract class ImageGenerationBase {
  /**
   * Universal model identifier (e.g., "black-forest-labs/flux-schnell")
   * This identifies the actual ML model regardless of provider
   */
  protected abstract readonly MODEL_ID: string;

  /**
   * Internal unique identifier for this specific provider implementation
   * Used for debugging, analytics, and internal tracking
   */
  protected abstract readonly INTERNAL_ID: string;

  /**
   * Get the universal model identifier
   */
  get modelId(): string {
    return this.MODEL_ID;
  }

  /**
   * Get the internal unique identifier for this provider implementation
   */
  get internalId(): string {
    return this.INTERNAL_ID;
  }

  abstract generate(
    prompt: string,
    options?: {
      width?: number;
      height?: number;
      userId?: string;
    }
  ): Promise<ImageGenerationResult>;
}
