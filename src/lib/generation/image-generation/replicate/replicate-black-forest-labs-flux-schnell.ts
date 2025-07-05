import { logger } from "@/lib/logger";
import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";
import { FLUX_SCHNELL_MODEL_ID } from "../runware/runware-flux-schnell";
import Replicate from "replicate";

export const REPLICATE_FLUX_SCHNELL_ID =
  "replicate/black-forest-labs/flux-schnell" as const;

/**
 * IMPORTANT: Currently not in use due to Replicate's lack of spending limits
 * in their service. This implementation is kept for reference but should not
 * be used in production until Replicate provides better cost control features.
 */
export class ReplicateBlackForestLabsFluxSchnell extends ImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_SCHNELL_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = REPLICATE_FLUX_SCHNELL_ID;

  // Provider-specific model ID (private)
  private static readonly REPLICATE_MODEL_ID =
    "black-forest-labs/flux-schnell" as const;

  async generate(prompt: string): Promise<ImageGenerationResult> {
    const replicate = new Replicate();

    const output = await replicate.run(
      ReplicateBlackForestLabsFluxSchnell.REPLICATE_MODEL_ID,
      {
        input: {
          prompt,
          num_outputs: 1,
        },
      }
    );

    // This is how it shows in docs
    // for (const [index, item] of Object.entries(output)) {
    //   await writeFile(`output_${index}.webp`, item);
    // }

    // I want single image
    const imageUrl = Object.entries(output)[0][1] as string;

    logger.debug("imageUrl", imageUrl);

    // Fetch the image from the URL and convert to Buffer
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    return {
      image: imageBuffer,
    };
  }
}
