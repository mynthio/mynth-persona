import { logger } from "@/lib/logger";
import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";
import { RunwareImageGenerationBase } from "./runware-base";

export const RUNWARE_SEEDREAM_3_ID = "runware/seedream-3" as const;
export const SEEDREAM_3_MODEL_ID = "seedream/seedream-3.0" as const;

export class RunwareSeedream3 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = SEEDREAM_3_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_SEEDREAM_3_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "SeeDream 3.0";

  // Provider-specific model ID (private)
  // Note: This is an estimated ID - you may need to verify the correct runware model ID
  protected readonly RUNWARE_MODEL_ID = "bytedance:3@1" as const;

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
}
