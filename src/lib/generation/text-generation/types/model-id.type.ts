import { GoogleGemini25FlashPreview0417 } from "../google/google-gemini-2.5-flash-preview-04-17";
import { OpenRouterMistralSmall3224bInstructFree } from "../openrouter/mistralai/mistral-small-3.2-24b-instruct-free";
import { OpenRouterQwen25Vl32bInstructFree } from "../openrouter/qwen/qwen2.5-vl-32b-instruct-free";

export type ModelId =
  | typeof GoogleGemini25FlashPreview0417.ID
  | typeof OpenRouterMistralSmall3224bInstructFree.ID
  | typeof OpenRouterQwen25Vl32bInstructFree.ID;
