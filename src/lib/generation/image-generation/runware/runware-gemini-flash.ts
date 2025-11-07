import { RunwareImageGenerationBase } from "./runware-base";

export const RUNWARE_GEMINI_FLASH_ID =
  "runware/gemini-flash-image-2.5" as const;
export const GEMINI_FLASH_MODEL_ID = "google/gemini-flash-image-2.5" as const;

export class RunwareGeminiFlash extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = GEMINI_FLASH_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_GEMINI_FLASH_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "Gemini Flash Image 2.5";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "google:4@1" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }
}
