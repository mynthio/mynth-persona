import { TextGenerationModelId } from "../models/text-generation-models.config";

export type ChatConfigModelConfig = {
  modelId: TextGenerationModelId;
};

export type ChatConfigModels = ChatConfigModelConfig[];

export type ChatConfig = {
  models: ChatConfigModels;
};

export const DEFAULT_CHAT_MODEL: TextGenerationModelId = "x-ai/grok-4-fast";

export const chatConfig: ChatConfig = {
  models: [
    {
      modelId: "x-ai/grok-4-fast",
    },
    {
      modelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition",
    },
    {
      modelId: "thedrummer/cydonia-24b-v4.1",
    },
    {
      modelId: "nousresearch/hermes-3-llama-3.1-70b",
    },
    {
      modelId: "nousresearch/hermes-3-llama-3.1-405b",
    },
    {
      modelId: "nousresearch/hermes-4-70b",
    },
    {
      modelId: "meta-llama/llama-3.3-70b-instruct",
    },
    {
      modelId: "z-ai/glm-4.5-air",
    },
    {
      modelId: "deepseek/deepseek-chat-v3.1",
    },
    {
      modelId: "aion-labs/aion-rp-llama-3.1-8b",
    },
    {
      modelId: "openai/gpt-oss-20b",
    },
    {
      modelId: "meituan/longcat-flash-chat",
    },
    {
      modelId: "nvidia/nemotron-nano-9b-v2",
    },
  ],
};
