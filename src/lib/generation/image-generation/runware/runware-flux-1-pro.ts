import { ImageGenerationResult } from "../image-generation-base";
import { RunwareImageGenerationBase } from "./runware-base";

export const RUNWARE_FLUX_1_PRO_ID = "runware/flux-1-pro" as const;
export const FLUX_1_PRO_MODEL_ID = "black-forest-labs/flux-1-pro" as const;

export class RunwareFlux1Pro extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = FLUX_1_PRO_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_FLUX_1_PRO_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "FLUX.1 Pro";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "bfl:1@1" as const;

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
  protected getDefaultWidth(): number {
    return 1024;
  }
  protected getDefaultHeight(): number {
    return 1024;
  }
  protected getTimeoutMs(): number {
    return 90000;
  }
  protected getPerRequestConfig(): { steps?: number; includeCost?: boolean } {
    return { includeCost: true };
  }
}
