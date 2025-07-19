import { logger } from "@/lib/logger";
import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";
import { RunwareImageGenerationBase } from "./runware-base";

export const RUNWARE_FLUX_1_1_PRO_ULTRA_ID =
  "runware/flux-1.1-pro-ultra" as const;
export const FLUX_1_1_PRO_ULTRA_MODEL_ID =
  "black-forest-labs/flux-1.1-pro-ultra" as const;

export class RunwareFlux11ProUltra extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_1_1_PRO_ULTRA_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_1_1_PRO_ULTRA_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "FLUX.1.1 Pro Ultra";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "bfl:2@2" as const;

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
    return { includeCost: true };
  }
}
