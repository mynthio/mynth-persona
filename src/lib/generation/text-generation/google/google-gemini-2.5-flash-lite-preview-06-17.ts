import { GoogleTextGenerationBase } from "./google-text-generation-base";

export class GoogleGemini25FlashLitePreview0617 extends GoogleTextGenerationBase {
  static readonly ID = "google/gemini-2.5-flash-lite-preview-06-17" as const;

  constructor() {
    super(
      GoogleGemini25FlashLitePreview0617.ID,
      "gemini-2.5-flash-lite-preview-06-17"
    );
  }
}
