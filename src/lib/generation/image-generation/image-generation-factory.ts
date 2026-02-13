import { ImageGenerationBase } from "./image-generation-base";
import { ImageModelId, IMAGE_MODELS } from "@/config/shared/image-models";
import { RunwareFluxDev } from "./runware/runware-flux-dev";
import { RunwareFluxKrea } from "./runware/runware-flux-krea";
import { RunwareSeedream3 } from "./runware/runware-seedream-3";
import { RunwareSeedream4 } from "./runware/runware-seedream-4";
import { RunwareSeedream45 } from "./runware/runware-seedream-4.5";
import { RunwareGeminiFlash } from "./runware/runware-gemini-flash";
import { RunwareImagen4 } from "./runware/runware-imagen-4";
import { RunwareGPTImage1 } from "./runware/runware-gpt-image-1";
import { RunwareQwenImage } from "./runware/runware-qwen-image";
import { RunwareBismuthIllustriousMixV5 } from "./runware/runware-bismuth-illustrious-mix-v5";
import { RunwareFlux2Dev } from "./runware/runware-flux-2-dev";
import { RunwareFlux2Klein4B } from "./runware/runware-flux-2-klein-4b";
import { RunwareFlux2Pro } from "./runware/runware-flux-2-pro";
import { RunwareImagineArt15 } from "./runware/runware-imagineart-1.5";
import { RunwareHunyuanImage3 } from "./runware/runware-hunyuan-image-3";
import { RunwareZImageTurbo } from "./runware/runware-z-image-turbo";
import { RunwarePImage } from "./runware/runware-p-image";
import { RunwareQwenImageEditPlus } from "./runware/runware-qwen-image-edit-plus";
import { RunwareRiverflow2Fast } from "./runware/runware-riverflow-2-fast";
import { logger } from "@/lib/logger";

// Simple model class mapping
const MODEL_CLASS_MAP: Record<ImageModelId, new () => ImageGenerationBase> = {
  // Cost 1 - Grouped by provider
  "black-forest-labs/flux-dev": RunwareFluxDev,
  "black-forest-labs/flux-krea-dev": RunwareFluxKrea,
  "black-forest-labs/flux-2-dev": RunwareFlux2Dev,
  "black-forest-labs/flux-2-klein-4b": RunwareFlux2Klein4B,
  "google/gemini-flash-image-2.5": RunwareGeminiFlash,
  "qwen/qwen-image": RunwareQwenImage,
  "qwen/qwen-image-edit-plus": RunwareQwenImageEditPlus,
  "seedream/seedream-3.0": RunwareSeedream3,
  "prsna/bismuth-illustrious-mix-v5.0": RunwareBismuthIllustriousMixV5,
  "imagineart/imagineart-1.5": RunwareImagineArt15,
  "z-image/z-image-turbo": RunwareZImageTurbo,
  "prunaai/p-image": RunwarePImage,
  // Cost 2 - Premium models
  "openai/gpt-image-1": RunwareGPTImage1,
  "google/imagen-4-preview": RunwareImagen4,
  "seedream/seedream-4.0": RunwareSeedream4,
  "seedream/seedream-4.5": RunwareSeedream45,
  "black-forest-labs/flux-2-pro": RunwareFlux2Pro,
  "tencent/hunyuan-image-3.0": RunwareHunyuanImage3,
  "sourceful/riverflow-2-fast": RunwareRiverflow2Fast,
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
