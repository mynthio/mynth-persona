import { logger } from "@/lib/logger";
import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";
import { RunwareImageGenerationBase } from "./runware-base";

export const RUNWARE_FLUX_SCHNELL_ID = "runware/flux-schnell" as const;
export const FLUX_SCHNELL_MODEL_ID = "black-forest-labs/flux-schnell" as const;

export class RunwareFluxSchnell extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_SCHNELL_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_SCHNELL_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "FLUX Schnell";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "runware:100@1" as const;

  async generate(
    prompt: string,
    options?: {
      width?: number;
      height?: number;
      userId?: string;
    }
  ): Promise<ImageGenerationResult> {
    try {
      return await super.generate(prompt, options);
    } catch (error) {
      throw error;
    }
  }
  protected getPerRequestConfig(): { steps?: number; includeCost?: boolean } {
    return { steps: 4 };
  }
}
