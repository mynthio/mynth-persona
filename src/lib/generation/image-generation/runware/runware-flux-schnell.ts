import { logger } from "@/lib/logger";
import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";
// @ts-ignore - Type definitions issue with @runware/ai-sdk-provider
import { runware } from "@runware/ai-sdk-provider";
import { experimental_generateImage as generateImage } from "ai";

export const RUNWARE_FLUX_SCHNELL_ID = "runware/flux-schnell" as const;
export const FLUX_SCHNELL_MODEL_ID = "black-forest-labs/flux-schnell" as const;

export class RunwareFluxSchnell extends ImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_SCHNELL_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_SCHNELL_ID;

  // Provider-specific model ID (private)
  private static readonly RUNWARE_MODEL_ID = "runware:100@1" as const;

  async generate(
    prompt: string,
    options?: {
      width?: number;
      height?: number;
      userId?: string;
    }
  ): Promise<ImageGenerationResult> {
    try {
      const width = options?.width || 512;
      const height = options?.height || 512;
      const size = `${width}x${height}` as const;

      const result = await generateImage({
        model: runware.image(RunwareFluxSchnell.RUNWARE_MODEL_ID),
        prompt,
        size,
        providerOptions: {
          runware: {
            steps: 4, // FLUX Schnell works well with fewer steps for speed
            outputFormat: "WEBP",
          },
        },
      });

      // At this point the provider does not return any valuable data to log

      // Handle the response structure properly
      const images = (result as any).images;
      if (!images || !Array.isArray(images) || images.length === 0) {
        throw new Error("No images returned from Runware");
      }

      const imageResult = images[0];
      if (!imageResult?.uint8ArrayData) {
        throw new Error("No image data returned from Runware");
      }

      // Convert uint8ArrayData object to Buffer
      const uint8ArrayData = imageResult.uint8ArrayData;
      const uint8Array = new Uint8Array(Object.keys(uint8ArrayData).length);
      for (const [index, value] of Object.entries(uint8ArrayData)) {
        uint8Array[parseInt(index)] = value as number;
      }
      const imageBuffer = Buffer.from(uint8Array);

      return {
        image: imageBuffer,
        revisedPrompt: imageResult.alt || undefined,
      };
    } catch (error) {
      logger.error("Error generating image with Runware", {
        error: error instanceof Error ? error.message : String(error),
        prompt,
        options,
      });
      throw error;
    }
  }
}
