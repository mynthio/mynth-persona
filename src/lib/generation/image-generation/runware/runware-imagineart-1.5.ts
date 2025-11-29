import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_IMAGINEART_1_5_ID = "runware/imagineart-1.5" as const;
const IMAGINEART_1_5_MODEL_ID = "imagineart/imagineart-1.5" as const;

export class RunwareImagineArt15 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = IMAGINEART_1_5_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_IMAGINEART_1_5_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "ImagineArt 1.5";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "imagineart:1@5" as const;

  protected getDefaultWidth(): number {
    return 1728;
  }

  protected getDefaultHeight(): number {
    return 2304;
  }

  // ImagineArt 1.5 does not support steps and other options
  // includeCost is handled by the base class, so we return empty config
  protected getPerRequestConfig(): { steps?: number; includeCost?: boolean } {
    return {};
  }
}

