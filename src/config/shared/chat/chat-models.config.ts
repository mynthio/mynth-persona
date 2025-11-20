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
      modelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition:standard",
    },
    {
      modelId: "raifle/sorcererlm-8x22b:premium",
    },
    {
      modelId: "thedrummer/cydonia-24b-v4.1:standard",
    },
    {
      modelId: "deepcogito/cogito-v2-preview-llama-405b:premium",
    },
    {
      modelId: "x-ai/grok-3:premium",
    },
    {
      modelId: "x-ai/grok-4-fast:standard",
    },
    {
      modelId: "aion-labs/aion-rp-llama-3.1-8b:standard",
    },
    {
      modelId: "meta-llama/llama-3.3-70b-instruct:standard",
    },
    {
      modelId: "deepseek/deepseek-chat-v3.1:standard",
    },
    {
      modelId: "tngtech/deepseek-r1t2-chimera:standard",
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
  ],
};
