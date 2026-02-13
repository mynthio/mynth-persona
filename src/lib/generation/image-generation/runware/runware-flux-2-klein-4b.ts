import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_FLUX_2_KLEIN_4B_ID = "runware/flux-2-klein-4b" as const;
const FLUX_2_KLEIN_4B_MODEL_ID = "black-forest-labs/flux-2-klein-4b" as const;

export class RunwareFlux2Klein4B extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_2_KLEIN_4B_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_2_KLEIN_4B_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "FLUX.2 [klein] 4B";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:400@4" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }

  protected getPerRequestConfig(): {
    steps?: number;
    CFGScale?: number;
    acceleration?: string;
    includeCost?: boolean;
  } {
    return {
      steps: 4,
      CFGScale: 4,
      acceleration: "high",
    };
  }
}
