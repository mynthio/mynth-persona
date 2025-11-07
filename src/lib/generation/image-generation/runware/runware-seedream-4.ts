import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_SEEDREAM_4_ID = "runware/seedream-4" as const;
const SEEDREAM_4_MODEL_ID = "seedream/seedream-4.0" as const;

export class RunwareSeedream4 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = SEEDREAM_4_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_SEEDREAM_4_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "SeeDream 4.0";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "bytedance:5@0" as const;

  protected getDefaultWidth(): number {
    return 1440;
  }

  protected getDefaultHeight(): number {
    return 2560;
  }
}
