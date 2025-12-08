import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_P_IMAGE_ID = "runware/p-image" as const;
const P_IMAGE_MODEL_ID = "prunaai/p-image" as const;

export class RunwarePImage extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = P_IMAGE_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_P_IMAGE_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "P-Image";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "prunaai:1@1" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1376;
  }

  protected getPerRequestConfig(): { steps?: number; CFGScale?: number } {
    // Do not send CFGScale or steps for this model
    return {};
  }
}
