import { ImageGenerationResult } from "../image-generation-base";
import { RunwareImageGenerationBase } from "./runware-base";

export const RUNWARE_BISMUTH_ILLUSTRIOUS_MIX_V4_0_ID =
  "runware/mynth/bismuth-illustrious-mix-v4.0" as const;
export const BISMUTH_ILLUSTRIOUS_MIX_V4_0_MODEL_ID =
  "bismuth-illustrious-mix-v4.0" as const;

export class RunwareBismuthIllustriousMixV40 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = BISMUTH_ILLUSTRIOUS_MIX_V4_0_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_BISMUTH_ILLUSTRIOUS_MIX_V4_0_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "Bismuth Illustrious Mix V4.0";

  // Provider-specific model ID (private)
  // Note: This is an estimated ID - you may need to verify the correct runware model ID
  protected readonly RUNWARE_MODEL_ID = "mynth:1@002" as const;

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

  protected getPerRequestConfig(): Record<string, any> {
    return {
      CFGScale: 7,
      steps: 27,
      scheduler: "EulerAncestralDiscreteScheduler",
      includeCost: true,
    };
  }
}
