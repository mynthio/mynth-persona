export type ImageGenerationResult = {
  image: Buffer;
  revisedPrompt?: string;
};

export type MultiImageGenerationResult = {
  images: ImageGenerationResult[];
  /** Number of images that failed to generate */
  failedCount: number;
};

export type GenerateOptions = {
  width?: number;
  height?: number;
  userId?: string;
  loras?: string[];
  referenceImages?: string[];
  negativePrompt?: string;
  /** Number of images to generate. Defaults to 1. */
  numberResults?: number;
};

export abstract class ImageGenerationBase {
  /**
   * Universal model identifier (e.g., "black-forest-labs/flux-dev")
   * This identifies the actual ML model regardless of provider
   */
  protected abstract readonly MODEL_ID: string;

  /**
   * Internal unique identifier for this specific provider implementation
   * Used for debugging, analytics, and internal tracking
   */
  protected abstract readonly INTERNAL_ID: string;

  /**
   * Human-friendly display name for the model
   * Used in UI for easier identification
   */
  protected abstract readonly DISPLAY_NAME: string;

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

  /**
   * Get the human-friendly display name for the model
   */
  get displayName(): string {
    return this.DISPLAY_NAME;
  }

  /**
   * Generate a single image (legacy method for backwards compatibility)
   */
  abstract generate(
    prompt: string,
    options?: GenerateOptions
  ): Promise<ImageGenerationResult>;

  /**
   * Generate multiple images in a single request
   * Returns all successful images plus count of failures
   */
  abstract generateMultiple(
    prompt: string,
    options?: GenerateOptions
  ): Promise<MultiImageGenerationResult>;
}
