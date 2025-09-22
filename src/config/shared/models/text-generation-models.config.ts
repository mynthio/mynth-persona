export type TextGenerationModelId =
  | "moonshotai/kimi-k2"
  | "cognitivecomputations/dolphin-mistral-24b-venice-edition"
  | "openai/gpt-oss-20b"
  | "meta-llama/llama-3.3-70b-instruct"
  | "mistralai/mistral-nemo"
  | "deepseek/deepseek-chat-v3.1"
  | "x-ai/grok-3-mini"
  | "thedrummer/anubis-70b-v1.1"
  | "meta-llama/llama-4-maverick"
  | "moonshotai/kimi-k2-0905"
  | "sao10k/l3.3-euryale-70b"
  | "x-ai/grok-4-fast";

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
  "x-ai/grok-4-fast": {
    enabled: true,
    isFreeVersionAvailable: true,
    modelId: "x-ai/grok-4-fast",
  },
  // Additional global models used by persona generation
  "thedrummer/anubis-70b-v1.1": {
    enabled: true,
    isFreeVersionAvailable: false,
    modelId: "thedrummer/anubis-70b-v1.1",
  },
  "meta-llama/llama-4-maverick": {
    enabled: true,
    isFreeVersionAvailable: false,
    modelId: "meta-llama/llama-4-maverick",
  },
  "moonshotai/kimi-k2-0905": {
    enabled: true,
    isFreeVersionAvailable: false,
    modelId: "moonshotai/kimi-k2-0905",
  },
  "sao10k/l3.3-euryale-70b": {
    enabled: true,
    isFreeVersionAvailable: false,
    modelId: "sao10k/l3.3-euryale-70b",
  },
};
