import { TextGenerationModelId } from "../models/text-generation-models.config";

export type ChatConfigModelConfig = {
  modelId: TextGenerationModelId;
};

export type ChatConfigModels = ChatConfigModelConfig[];

export type ChatConfig = {
  models: ChatConfigModels;
};

export const DEFAULT_CHAT_MODEL: TextGenerationModelId =
  "nousresearch/hermes-4-70b:eco";

export const chatConfig: ChatConfig = {
  models: [
    {
      modelId: "deepseek/deepseek-v3.2:eco",
    },
    {
      modelId: "deepseek/deepseek-v3.2:standard",
    },
    {
      modelId: "nousresearch/hermes-4-70b:eco",
    },
    {
      modelId: "nousresearch/hermes-4-70b:standard",
    },
    {
      modelId: "nousresearch/hermes-3-llama-3.1-405b:premium",
    },
    {
      modelId: "nousresearch/hermes-3-llama-3.1-70b:standard",
    },
    {
      modelId:
        "cognitivecomputations/dolphin-mistral-24b-venice-edition:standard",
    },
    {
      modelId: "raifle/sorcererlm-8x22b:premium",
    },
    {
      modelId: "thedrummer/cydonia-24b-v4.1:standard",
    },
    {
      modelId: "thedrummer/skyfall-36b-v2:standard",
    },
    {
      modelId: "deepcogito/cogito-v2-preview-llama-405b:premium",
    },
    {
      modelId: "x-ai/grok-3:premium",
    },
    {
      modelId: "google/gemini-3-pro-preview:premium",
    },
    {
      modelId: "x-ai/grok-4-fast:standard",
    },
    {
      modelId: "google/gemini-2.5-flash-preview-09-2025:standard",
    },
    {
      modelId: "google/gemini-3-flash-preview:standard",
    },
    {
      modelId: "aion-labs/aion-rp-llama-3.1-8b:standard",
    },
    {
      modelId: "meta-llama/llama-3.3-70b-instruct:standard",
    },
    {
      modelId: "anthropic/claude-haiku-4.5:premium",
    },
    {
      modelId: "z-ai/glm-4.5-air:standard",
    },
    {
      modelId: "meituan/longcat-flash-chat:standard",
    },
    {
      modelId: "openai/gpt-oss-20b:standard",
    },
    {
      modelId: "nvidia/nemotron-nano-9b-v2:standard",
    },
    {
      modelId: "minimax/minimax-m2-her:eco",
    },
    {
      modelId: "minimax/minimax-m2-her:standard",
    },
  ],
};
