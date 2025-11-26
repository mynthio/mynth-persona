import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_BISMUTH_ID = "runware/bismuth-illustrious-mix-v5.0" as const;
const BISMUTH_MODEL_ID = "prsna/bismuth-illustrious-mix-v5.0" as const;

export class RunwareBismuthIllustriousMixV5 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = BISMUTH_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_BISMUTH_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "Bismuth Illustrious Mix v5.0";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "mynth:1@003" as const;

  protected getDefaultWidth(): number {
    return 896;
  }

  protected getDefaultHeight(): number {
    return 1152;
  }

  protected getPerRequestConfig(): {
    CFGScale: number;
    clipSkip: number;
    steps: number;
  } {
    return {
      CFGScale: 5.5,
      clipSkip: 0,
      steps: 28,
    };
  }
}

