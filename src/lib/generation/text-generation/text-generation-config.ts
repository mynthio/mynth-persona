import { GoogleGemini25FlashPreview0417 } from "./google/google-gemini-2.5-flash-preview-04-17";
import { OpenRouterMistralSmall3224bInstructFree } from "./openrouter/mistralai/mistral-small-3.2-24b-instruct-free";
import { OpenRouterQwen25Vl32bInstructFree } from "./openrouter/qwen/qwen2.5-vl-32b-instruct-free";
import { TextGenerationBase } from "./text-generation-base";
import { ModelId } from "./types/model-id.type";
import { TextGenerationConfigModel } from "./types/text-generation-config-model.type";

// Define a constructor type for concrete text generation classes
type TextGenerationConstructor = new () => TextGenerationBase;

export const textGenerationConfig: Array<TextGenerationConfigModel> = [
  {
    id: GoogleGemini25FlashPreview0417.ID,
    isAvailableToFreeUsers: false,
    isDepracated: false,
    quality: "medium",
  },
  {
    id: OpenRouterMistralSmall3224bInstructFree.ID,
    isAvailableToFreeUsers: true,
    isDepracated: false,
    quality: "medium",
  },
  {
    id: OpenRouterQwen25Vl32bInstructFree.ID,
    isAvailableToFreeUsers: true,
    isDepracated: false,
    quality: "medium",
  },
];

export const textGenerationModels: Record<ModelId, TextGenerationConstructor> =
  {
    [GoogleGemini25FlashPreview0417.ID]: GoogleGemini25FlashPreview0417,
    [OpenRouterMistralSmall3224bInstructFree.ID]:
      OpenRouterMistralSmall3224bInstructFree,
    [OpenRouterQwen25Vl32bInstructFree.ID]: OpenRouterQwen25Vl32bInstructFree,
  };
