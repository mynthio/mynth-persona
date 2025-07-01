import { GoogleTextGenerationBase } from "./google-text-generation-base";

export class GoogleGemini25Flash extends GoogleTextGenerationBase {
  static readonly ID = "google/gemini-2.5-flash" as const;

  constructor() {
    super(GoogleGemini25Flash.ID, "gemini-2.5-flash");
  }
}
