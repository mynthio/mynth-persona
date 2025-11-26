import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_FLUX_2_DEV_ID = "runware/flux-2-dev" as const;
const FLUX_2_DEV_MODEL_ID = "black-forest-labs/flux-2-dev" as const;

export class RunwareFlux2Dev extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_2_DEV_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_2_DEV_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "FLUX.2 [dev]";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:400@1" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }

  protected getPerRequestConfig(): { steps?: number; includeCost?: boolean } {
    return { steps: 35 };
  }
}

