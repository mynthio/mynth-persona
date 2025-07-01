import { GoogleGemini25FlashLitePreview0617 } from "../google/google-gemini-2.5-flash-lite-preview-06-17";
import { GoogleGemini25Flash } from "../google/google-gemini-2.5-flash";
import { OpenRouterMistralSmall3224bInstructFree } from "../openrouter/mistralai/mistral-small-3.2-24b-instruct-free";
import { OpenRouterQwen25Vl32bInstructFree } from "../openrouter/qwen/qwen2.5-vl-32b-instruct-free";

export type ModelId =
  | typeof GoogleGemini25FlashLitePreview0617.ID
  | typeof GoogleGemini25Flash.ID
  | typeof OpenRouterMistralSmall3224bInstructFree.ID
  | typeof OpenRouterQwen25Vl32bInstructFree.ID;
