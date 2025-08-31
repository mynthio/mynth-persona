export type TextGenerationModelId =
  | "moonshotai/kimi-k2"
  | "cognitivecomputations/dolphin-mistral-24b-venice-edition"
  | "openai/gpt-oss-20b"
  | "meta-llama/llama-3.3-70b-instruct"
  | "mistralai/mistral-nemo"
  | "deepseek/deepseek-chat-v3.1"
  | "x-ai/grok-3-mini";

export type TextGenerationModelConfig = {
  enabled: boolean;
  isFreeVersionAvailable: boolean;

  modelId: string;
};

export const textGenerationModels: Record<
  TextGenerationModelId | string,
  TextGenerationModelConfig | undefined
> = {
  "moonshotai/kimi-k2": {
    enabled: true,
    isFreeVersionAvailable: true,
    modelId: "moonshotai/kimi-k2",
  },
  "cognitivecomputations/dolphin-mistral-24b-venice-edition": {
    enabled: true,
    isFreeVersionAvailable: true,
    modelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition",
  },
  "openai/gpt-oss-20b": {
    enabled: true,
    isFreeVersionAvailable: true,
    modelId: "openai/gpt-oss-20b",
  },
  "meta-llama/llama-3.3-70b-instruct": {
    enabled: true,
    isFreeVersionAvailable: true,
    modelId: "meta-llama/llama-3.3-70b-instruct",
  },
  "mistralai/mistral-nemo": {
    enabled: true,
    isFreeVersionAvailable: false,
    modelId: "mistralai/mistral-nemo",
  },
  "deepseek/deepseek-chat-v3.1": {
    enabled: true,
    isFreeVersionAvailable: false,
    modelId: "deepseek/deepseek-chat-v3.1",
  },
  "x-ai/grok-3-mini": {
    enabled: true,
    isFreeVersionAvailable: false,
    modelId: "x-ai/grok-3-mini",
  },
};
