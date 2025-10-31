import { ImageGenerationBase } from "./image-generation-base";
import { ImageModelId, IMAGE_MODELS } from "@/config/shared/image-models";
import { RunwareFluxDev } from "./runware/runware-flux-dev";
import { RunwareSeedream3 } from "./runware/runware-seedream-3";
import { RunwareSeedream4 } from "./runware/runware-seedream-4";
import { RunwareGeminiFlash } from "./runware/runware-gemini-flash";
import { RunwareImagen4 } from "./runware/runware-imagen-4";
import { logger } from "@/lib/logger";

// Simple model class mapping
const MODEL_CLASS_MAP: Record<
  ImageModelId,
  new () => ImageGenerationBase
> = {
  "black-forest-labs/flux-dev": RunwareFluxDev,
  "seedream/seedream-3.0": RunwareSeedream3,
  "seedream/seedream-4.0": RunwareSeedream4,
  "google/gemini-flash-image-2.5": RunwareGeminiFlash,
  "google/imagen-4-preview": RunwareImagen4,
};

export class ImageGenerationFactory {
  /**
   * Get model handler by model ID
   */
  static byModelId(modelId: ImageModelId): ImageGenerationBase {
    logger.debug({ modelId }, "Getting model handler by model ID");

    const modelClass = MODEL_CLASS_MAP[modelId];
    if (!modelClass) {
      throw new Error(`No handler found for model: ${modelId}`);
    }

    return new modelClass();
  }
}
