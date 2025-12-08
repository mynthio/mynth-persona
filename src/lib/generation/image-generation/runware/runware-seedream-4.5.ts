import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_SEEDREAM_4_5_ID = "runware/seedream-4.5" as const;
const SEEDREAM_4_5_MODEL_ID = "seedream/seedream-4.5" as const;

export class RunwareSeedream45 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = SEEDREAM_4_5_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_SEEDREAM_4_5_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "SeeDream 4.5";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "bytedance:seedream@4.5" as const;

  protected getDefaultWidth(): number {
    return 1440;
  }

  protected getDefaultHeight(): number {
    return 2560;
  }

  protected getPerRequestConfig(): { steps?: number; CFGScale?: number } {
    // Do not send CFGScale or steps for this model
    return {};
  }
}

