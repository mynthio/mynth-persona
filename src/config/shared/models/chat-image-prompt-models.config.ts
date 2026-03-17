export const CHAT_IMAGE_PROMPT_TEXT_MODELS = [
  "moonshotai/kimi-k2.5",
  "google/gemini-3.1-flash-lite-preview",
  "z-ai/glm-5",
  "bytedance-seed/seed-2.0-lite",
  "moonshotai/kimi-k2-0905",
] as const;

export const CHAT_IMAGE_PROMPT_PRIMARY_MODEL = CHAT_IMAGE_PROMPT_TEXT_MODELS[0];

export const CHAT_IMAGE_PROMPT_FALLBACK_MODELS =
  CHAT_IMAGE_PROMPT_TEXT_MODELS.slice(1, 3);

export const MESSAGE_IMAGE_PROMPT_CONTEXT_CONFIG = {
  fetchLimit: 12,
  conversationWindow: 8,
  checkpointWindow: 3,
  maxCharactersPerMessage: 700,
  maxCharactersPerCheckpoint: 500,
  maxCharactersPerSceneReferencePrompt: 900,
} as const;
