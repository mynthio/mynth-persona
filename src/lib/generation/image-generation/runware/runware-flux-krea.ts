import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_FLUX_KREA_ID = "runware/flux-krea-dev" as const;
const FLUX_KREA_MODEL_ID = "black-forest-labs/flux-krea-dev" as const;

export class RunwareFluxKrea extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_KREA_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_KREA_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "FLUX.1 Krea [dev]";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:107@1" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }
}
