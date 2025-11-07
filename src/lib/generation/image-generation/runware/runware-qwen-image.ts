import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_QWEN_IMAGE_ID = "runware/qwen-image" as const;
const QWEN_IMAGE_MODEL_ID = "qwen/qwen-image" as const;

export class RunwareQwenImage extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = QWEN_IMAGE_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_QWEN_IMAGE_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "Qwen Image";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:108@1" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }
}
