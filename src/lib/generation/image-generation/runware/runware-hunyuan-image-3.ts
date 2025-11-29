import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_HUNYUAN_IMAGE_3_ID = "runware/hunyuan-image-3.0" as const;
const HUNYUAN_IMAGE_3_MODEL_ID = "tencent/hunyuan-image-3.0" as const;

export class RunwareHunyuanImage3 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = HUNYUAN_IMAGE_3_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_HUNYUAN_IMAGE_3_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "HunyuanImage-3.0";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:180@1" as const;

  protected getDefaultWidth(): number {
    return 896;
  }

  protected getDefaultHeight(): number {
    return 1152;
  }

  // HunyuanImage-3.0 does not support steps and CFGScale
  // includeCost is handled by the base class, so we return empty config
  protected getPerRequestConfig(): {
    steps?: number;
    CFGScale?: number;
    includeCost?: boolean;
  } {
    return {};
  }
}

