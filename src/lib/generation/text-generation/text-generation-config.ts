import { GoogleGemini25FlashLitePreview0617 } from "./google/google-gemini-2.5-flash-lite-preview-06-17";
import { GoogleGemini25Flash } from "./google/google-gemini-2.5-flash";
import { OpenRouterMistralSmall3224bInstructFree } from "./openrouter/mistralai/mistral-small-3.2-24b-instruct-free";
import { OpenRouterQwen25Vl32bInstructFree } from "./openrouter/qwen/qwen2.5-vl-32b-instruct-free";
import { OpenRouterMetaLlamaLlama4MaverickFree } from "./openrouter/meta-llama/llama-4-maverick-free";
import { OpenRouterCognitiveComputationsDolphinMistral24bVeniceEditionFree } from "./openrouter/cognitivecomputations/dolphin-mistral-24b-venice-edition-free";
import { OpenRouterDeepSeekR10528Free } from "./openrouter/deepseek/deepseek-r1-0528-free";
import { TextGenerationBase } from "./text-generation-base";
import { ModelId } from "./types/model-id.type";
import { TextGenerationConfigModel } from "./types/text-generation-config-model.type";
import { OpenRouterMetaLlamaLlama4ScoutFree } from "./openrouter/meta-llama/llama-4-scout-free";

// Define a constructor type for concrete text generation classes
type TextGenerationConstructor = new () => TextGenerationBase;

export const textGenerationConfig: Array<TextGenerationConfigModel> = [
  {
    id: GoogleGemini25FlashLitePreview0617.ID,
    isAvailableToFreeUsers: false,
    isDepracated: false,
    quality: "medium",
  },
  {
    id: GoogleGemini25Flash.ID,
    isAvailableToFreeUsers: false,
    isDepracated: false,
    quality: "high",
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
  {
    id: OpenRouterMetaLlamaLlama4MaverickFree.ID,
    isAvailableToFreeUsers: false,
    isDepracated: false,
    quality: "high",
  },
  {
    id: OpenRouterCognitiveComputationsDolphinMistral24bVeniceEditionFree.ID,
    isAvailableToFreeUsers: true,
    isDepracated: true,
    quality: "medium",
  },
  {
    id: OpenRouterMetaLlamaLlama4ScoutFree.ID,
    isAvailableToFreeUsers: true,
    isDepracated: true,
    quality: "medium",
  },
  {
    id: OpenRouterDeepSeekR10528Free.ID,
    isAvailableToFreeUsers: true,
    isDepracated: false,
    quality: "high",
  },
];

export const textGenerationModels: Record<ModelId, TextGenerationConstructor> =
  {
    [GoogleGemini25FlashLitePreview0617.ID]: GoogleGemini25FlashLitePreview0617,
    [GoogleGemini25Flash.ID]: GoogleGemini25Flash,
    [OpenRouterMistralSmall3224bInstructFree.ID]:
      OpenRouterMistralSmall3224bInstructFree,
    [OpenRouterQwen25Vl32bInstructFree.ID]: OpenRouterQwen25Vl32bInstructFree,
    [OpenRouterMetaLlamaLlama4MaverickFree.ID]:
      OpenRouterMetaLlamaLlama4MaverickFree,
    [OpenRouterCognitiveComputationsDolphinMistral24bVeniceEditionFree.ID]:
      OpenRouterCognitiveComputationsDolphinMistral24bVeniceEditionFree,
    [OpenRouterMetaLlamaLlama4ScoutFree.ID]: OpenRouterMetaLlamaLlama4ScoutFree,
    [OpenRouterDeepSeekR10528Free.ID]: OpenRouterDeepSeekR10528Free,
  };
