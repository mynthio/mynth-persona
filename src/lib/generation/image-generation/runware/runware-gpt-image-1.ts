import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_GPT_IMAGE_1_ID = "runware/gpt-image-1" as const;
const GPT_IMAGE_1_MODEL_ID = "openai/gpt-image-1" as const;

export class RunwareGPTImage1 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = GPT_IMAGE_1_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_GPT_IMAGE_1_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "GPT Image 1";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "openai:1@1" as const;

  protected getDefaultWidth(): number {
    return 1024;
  }

  protected getDefaultHeight(): number {
    return 1536;
  }

  protected getPerRequestConfig(): { providerSettings?: { openai?: { quality?: string } } } {
    return {
      providerSettings: {
        openai: {
          quality: "medium",
        },
      },
    };
  }
}
