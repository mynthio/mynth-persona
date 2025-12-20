import { RunwareImageGenerationBase } from "./runware-base";

type PerRequestConfig = {
  steps?: number;
  includeCost?: boolean;
  providerSettings?: any;
  CFGScale?: number;
  clipSkip?: number;
  scheduler?: string;
  acceleration?: string;
};

const RUNWARE_QWEN_IMAGE_EDIT_PLUS_ID = "runware/qwen-image-edit-plus" as const;
const QWEN_IMAGE_EDIT_PLUS_MODEL_ID = "qwen/qwen-image-edit-plus" as const;

export class RunwareQwenImageEditPlus extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = QWEN_IMAGE_EDIT_PLUS_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_QWEN_IMAGE_EDIT_PLUS_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "Qwen Image Edit Plus";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:108@22" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }

  protected getPerRequestConfig(): PerRequestConfig {
    return { acceleration: "none" };
  }

  /**
   * Qwen Image Edit Plus requires reference images at root level
   * Override default behavior which puts them in inputs
   */
  protected buildReferenceImagesRequest(
    referenceImages: string[]
  ): Record<string, any> {
    // Qwen requires referenceImages at root, even if empty
    return {
      referenceImages,
    };
  }
}
