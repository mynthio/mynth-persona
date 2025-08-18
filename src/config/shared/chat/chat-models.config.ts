import { TextGenerationModelId } from "../models/text-generation-models.config";

export type ChatConfigModelConfig = {
  modelId: TextGenerationModelId;

  displayName: string;

  cost: number;
};

export type ChatConfigModels = ChatConfigModelConfig[];

export type ChatConfig = {
  models: ChatConfigModels;
};

export const chatConfig: ChatConfig = {
  models: [
    {
      modelId: "moonshotai/kimi-k2",
      displayName: "Kimi K2",
      cost: 0,
    },
    {
      modelId: "openai/gpt-oss-20b",
      displayName: "OpenAI GPT-OSS 20B",
      cost: 0,
    },
    {
      modelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition",
      displayName: "Dolphin Mistral 24B Venice Edition (Venice)",
      cost: 0,
    },
    {
      modelId: "meta-llama/llama-3.3-70b-instruct",
      displayName: "Llama 3.3 70B Instruct (Venice)",
      cost: 0,
    },
    {
      modelId: "mistralai/mistral-nemo",
      displayName: "Mistral Nemo",
      cost: 1,
    },
    {
      modelId: "deepseek/deepseek-chat-v3.1",
      displayName: "Deepseek V3.1",
      cost: 1,
    },
    {
      modelId: "x-ai/grok-3-mini",
      displayName: "Grok 3 Mini",
      cost: 1,
    },
  ],
};
