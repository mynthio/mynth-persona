import { logger } from "@/lib/logger";
import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";
import { RunwareImageGenerationBase } from "./runware-base";

export const RUNWARE_FLUX_DEV_ID = "runware/flux-dev" as const;
export const FLUX_DEV_MODEL_ID = "black-forest-labs/flux-dev" as const;

export class RunwareFluxDev extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_DEV_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_DEV_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "FLUX Dev";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:101@1" as const;

  protected getPerRequestConfig(): { steps?: number; includeCost?: boolean } {
    return { steps: 35 };
  }
}
