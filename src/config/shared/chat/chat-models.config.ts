import { TextGenerationModelId } from "../models/text-generation-models.config";

export type ChatConfigModelConfig = {
  modelId: TextGenerationModelId;
};

export type ChatConfigModels = ChatConfigModelConfig[];

export type ChatConfig = {
  models: ChatConfigModels;
};

export const DEFAULT_CHAT_MODEL: TextGenerationModelId =
  "nousresearch/hermes-4-70b";

export const chatConfig: ChatConfig = {
  models: [
    {
      modelId: "nousresearch/hermes-4-70b",
    },
    {
      modelId: "nousresearch/hermes-3-llama-3.1-405b",
    },
    {
      modelId: "nousresearch/hermes-3-llama-3.1-70b",
    },
    {
      modelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition",
    },
    {
      modelId: "raifle/sorcererlm-8x22b",
    },
    {
      modelId: "thedrummer/cydonia-24b-v4.1",
    },
    {
      modelId: "deepcogito/cogito-v2-preview-llama-405b",
    },
    {
      modelId: "x-ai/grok-3",
    },
    {
      modelId: "x-ai/grok-4-fast",
    },
    {
      modelId: "aion-labs/aion-rp-llama-3.1-8b",
    },
    {
      modelId: "meta-llama/llama-3.3-70b-instruct",
    },
    {
      modelId: "deepseek/deepseek-chat-v3.1",
    },
    {
      modelId: "tngtech/deepseek-r1t2-chimera",
    },
    {
      modelId: "anthropic/claude-haiku-4.5",
    },
    {
      modelId: "z-ai/glm-4.5-air",
    },
    {
      modelId: "meituan/longcat-flash-chat",
    },
    {
      modelId: "openai/gpt-oss-20b",
    },
    {
      modelId: "nvidia/nemotron-nano-9b-v2",
    },
  ],
};
