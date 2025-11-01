import { ImageGenerationBase } from "./image-generation-base";
import { ImageModelId, IMAGE_MODELS } from "@/config/shared/image-models";
import { RunwareFluxDev } from "./runware/runware-flux-dev";
import { RunwareFluxKrea } from "./runware/runware-flux-krea";
import { RunwareSeedream3 } from "./runware/runware-seedream-3";
import { RunwareSeedream4 } from "./runware/runware-seedream-4";
import { RunwareGeminiFlash } from "./runware/runware-gemini-flash";
import { RunwareImagen4 } from "./runware/runware-imagen-4";
import { RunwareGPTImage1 } from "./runware/runware-gpt-image-1";
import { RunwareQwenImage } from "./runware/runware-qwen-image";
import { logger } from "@/lib/logger";

// Simple model class mapping
const MODEL_CLASS_MAP: Record<
  ImageModelId,
  new () => ImageGenerationBase
> = {
  // Cost 1 - Grouped by provider
  "black-forest-labs/flux-dev": RunwareFluxDev,
  "black-forest-labs/flux-krea-dev": RunwareFluxKrea,
  "google/gemini-flash-image-2.5": RunwareGeminiFlash,
  "qwen/qwen-image": RunwareQwenImage,
  "seedream/seedream-3.0": RunwareSeedream3,
  // Cost 2 - Premium models
  "openai/gpt-image-1": RunwareGPTImage1,
  "google/imagen-4-preview": RunwareImagen4,
  "seedream/seedream-4.0": RunwareSeedream4,
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
