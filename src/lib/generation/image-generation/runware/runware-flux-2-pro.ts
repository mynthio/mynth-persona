import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_FLUX_2_PRO_ID = "runware/flux-2-pro" as const;
const FLUX_2_PRO_MODEL_ID = "black-forest-labs/flux-2-pro" as const;

export class RunwareFlux2Pro extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_2_PRO_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_2_PRO_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "FLUX.2 [pro]";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "bfl:5@1" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }

  // FLUX.2 [pro] (bfl:5@1) does not support steps parameter
  // includeCost is handled by the base class, so we return empty config
  protected getPerRequestConfig(): { steps?: number; includeCost?: boolean } {
    return {};
  }
}
