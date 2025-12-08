import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_Z_IMAGE_TURBO_ID = "runware/z-image-turbo" as const;
const Z_IMAGE_TURBO_MODEL_ID = "z-image/z-image-turbo" as const;

export class RunwareZImageTurbo extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = Z_IMAGE_TURBO_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_Z_IMAGE_TURBO_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "Z-Image-Turbo";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:z-image@turbo" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }

  protected getNumberResults(): number {
    return 2;
  }

  protected getPerRequestConfig(): { steps?: number; CFGScale?: number } {
    // Do not send CFGScale or steps for this model
    return {};
  }
}

