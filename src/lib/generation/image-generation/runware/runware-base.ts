import { Runware, RunwareClient } from "@runware/sdk-js";
import { logger } from "@/lib/logger";
import {
  ImageGenerationBase,
  ImageGenerationResult,
  MultiImageGenerationResult,
  GenerateOptions,
} from "../image-generation-base";

type PerRequestConfig = {
  steps?: number;
  includeCost?: boolean;
  providerSettings?: any; // Flexible to support various providers (openai, bfl, etc)
  CFGScale?: number;
  clipSkip?: number;
  scheduler?: string;
};

export abstract class RunwareImageGenerationBase extends ImageGenerationBase {
  protected abstract readonly RUNWARE_MODEL_ID: string;

  protected getDefaultWidth(): number {
    return 512;
  }

  protected getDefaultHeight(): number {
    return 512;
  }

  protected getTimeoutMs(): number {
    return 60000;
  }

  protected getGlobalMaxRetries(): number {
    return 2;
  }

  protected getNumberResults(): number {
    return 1;
  }

  protected getFetchTimeoutMs(): number {
    return 15000;
  }

  protected getFetchMaxRetries(): number {
    return 3;
  }

  protected getRetryBaseDelayMs(): number {
    return 500;
  }

  protected getPerRequestConfig(_options?: GenerateOptions): PerRequestConfig {
    return {};
  }

  private createClient(): RunwareClient {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      throw new Error("RUNWARE_API_KEY is not set");
    }

    return new Runware({
      apiKey,
      shouldReconnect: true,
      globalMaxRetries: this.getGlobalMaxRetries(),
      timeoutDuration: this.getTimeoutMs(),
    });
  }

  private async fetchImageBufferFromUrl(imageUrl: string): Promise<Buffer> {
    const maxAttempts = this.getFetchMaxRetries();
    const timeoutMs = this.getFetchTimeoutMs();

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch image from URL: ${response.status} ${response.statusText}`
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;

        const isLastAttempt = attempt === maxAttempts;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        logger.warn(
          {
            attempt,
            maxAttempts,
            timeoutMs,
            error: errorMessage,
            url: imageUrl,
          },
          `Image fetch attempt ${attempt}/${maxAttempts} failed`
        );

        if (isLastAttempt) break;

        // Exponential backoff with jitter
        const baseDelay = this.getRetryBaseDelayMs() * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * baseDelay * 0.2);
        const delayMs = baseDelay + jitter;
        await this.delay(delayMs);
      }
    }

    throw new Error(
      `Failed to fetch image after ${maxAttempts} attempts. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }

  /**
   * Try to fetch image buffer, return null on failure instead of throwing
   */
  private async fetchImageBufferFromUrlSafe(
    imageUrl: string,
    index: number
  ): Promise<{ index: number; buffer: Buffer } | null> {
    try {
      const buffer = await this.fetchImageBufferFromUrl(imageUrl);
      return { index, buffer };
    } catch (error) {
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
          url: imageUrl,
          index,
        },
        `Failed to fetch image ${index}, continuing with others`
      );
      return null;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async generate(
    prompt: string,
    options?: GenerateOptions
  ): Promise<ImageGenerationResult> {
    const width = options?.width ?? this.getDefaultWidth();
    const height = options?.height ?? this.getDefaultHeight();

    try {
      const client = this.createClient();

      const requestConfig = this.getPerRequestConfig(options);
      const images = await client.requestImages({
        positivePrompt: prompt,
        negativePrompt: options?.negativePrompt,
        model: this.RUNWARE_MODEL_ID,
        width,
        height,
        numberResults: options?.numberResults ?? this.getNumberResults(),
        includeCost: true,
        referenceImages: options?.referenceImages ?? undefined,
        ...requestConfig,
      });

      if (!images || images.length === 0 || !images[0]?.imageURL) {
        throw new Error("No images returned from Runware SDK");
      }

      logger.info({
        event: "image-generation-cost",
        component: "generation:image-generation:runware",
        ai_meta: {
          model: this.MODEL_ID,
          provider: "runware",
          type: "text-to-image",
        },
        attributes: {
          cost: images?.reduce((acc, image) => acc + (image.cost ?? 0), 0),
        },
      });

      const imageBuffer = await this.fetchImageBufferFromUrl(
        images[0].imageURL as string
      );

      return {
        image: imageBuffer,
        revisedPrompt: undefined,
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          prompt,
          options,
          provider: this.internalId,
          model: this.modelId,
        },
        `Error generating image with ${this.displayName}`
      );
      throw error;
    }
  }

  async generateMultiple(
    prompt: string,
    options?: GenerateOptions
  ): Promise<MultiImageGenerationResult> {
    const width = options?.width ?? this.getDefaultWidth();
    const height = options?.height ?? this.getDefaultHeight();
    const numberResults = options?.numberResults ?? this.getNumberResults();

    try {
      const client = this.createClient();

      const requestConfig = this.getPerRequestConfig(options);
      const images = await client.requestImages({
        positivePrompt: prompt,
        negativePrompt: options?.negativePrompt,
        model: this.RUNWARE_MODEL_ID,
        width,
        height,
        numberResults,
        includeCost: true,
        referenceImages: options?.referenceImages ?? undefined,
        ...requestConfig,
      });

      if (!images || images.length === 0) {
        throw new Error("No images returned from Runware SDK");
      }

      logger.info({
        event: "image-generation-cost",
        component: "generation:image-generation:runware",
        ai_meta: {
          model: this.MODEL_ID,
          provider: "runware",
          type: "text-to-image",
        },
        attributes: {
          cost: images?.reduce((acc, image) => acc + (image.cost ?? 0), 0),
          requestedCount: numberResults,
          returnedCount: images.length,
        },
      });

      // Fetch all image buffers in parallel, with graceful error handling
      const fetchPromises = images.map((img, index) =>
        img.imageURL
          ? this.fetchImageBufferFromUrlSafe(img.imageURL as string, index)
          : Promise.resolve(null)
      );

      const fetchResults = await Promise.all(fetchPromises);

      // Filter out failed fetches and build results
      const successfulImages: ImageGenerationResult[] = [];
      let failedCount = 0;

      for (const result of fetchResults) {
        if (result) {
          successfulImages.push({
            image: result.buffer,
            revisedPrompt: undefined,
          });
        } else {
          failedCount++;
        }
      }

      // If ALL images failed, throw an error
      if (successfulImages.length === 0) {
        throw new Error(
          `All ${numberResults} image(s) failed to generate or fetch`
        );
      }

      return {
        images: successfulImages,
        failedCount,
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          prompt,
          options,
          provider: this.internalId,
          model: this.modelId,
        },
        `Error generating images with ${this.displayName}`
      );
      throw error;
    }
  }
}
