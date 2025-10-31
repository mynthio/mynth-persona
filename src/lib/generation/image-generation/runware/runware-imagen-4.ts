import { RunwareImageGenerationBase } from "./runware-base";

export const RUNWARE_IMAGEN_4_ID = "runware/imagen-4-preview" as const;
export const IMAGEN_4_MODEL_ID = "google/imagen-4-preview" as const;

export class RunwareImagen4 extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = IMAGEN_4_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_IMAGEN_4_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "Google Imagen 4 Preview";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "google:2@1" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1408;
  }
}
