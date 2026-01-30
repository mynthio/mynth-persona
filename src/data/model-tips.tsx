import { ReactNode } from "react";

export type ModelTip = {
  id: string;
  content: ReactNode;
};

/**
 * Model tips indexed by base model name (without tier suffix like :eco, :standard, :premium).
 * This allows tips defined once to apply to all variants of a model.
 */
const MODEL_TIPS_BY_BASE: Record<string, ModelTip[]> = {
  "nousresearch/hermes-4-70b": [
    {
      id: "hermes-4-placeholder",
      content: (
        <>
          The first message establishes everything: length, style, tone, and
          format. If you want short responses, write a short first message. The
          model picks up these constraints more reliably than from system
          instructions alone.
        </>
      ),
    },
    {
      id: "hermes-4-user-driven",
      content: (
        <>
          If You don&apos;t drive the story, Hermes may produce increasingly
          aimless responses or default to asterisk descriptions over dialogue.
          Keep the story moving by guiding the conversation.
        </>
      ),
    },
    {
      id: "hermes-4-system-remember",
      content: (
        <>
          Hermes reliably remembers character details from the system prompt but
          may &quot;forget&quot; information shared mid-conversation. Characters
          might claim &quot;you never told me that&quot; about things clearly in
          context.
        </>
      ),
    },
    {
      id: "hermes-4-system-repetition",
      content: (
        <>
          Phrases like &quot;shivers down spine&quot; or other synthetic-data
          artifacts appear periodically due to training data characteristics.
        </>
      ),
    },
  ],
  "google/gemini-3-pro-preview": [
    {
      id: "gemini-3-pro-mature-content",
      content: (
        <>
          Model respond differently to mature content. If you&apos;re finding a
          model too restrictive, try establishing your scene with a different
          model first, then switching. Context from previous messages influences
          behavior.
        </>
      ),
    },
  ],
  "minimax/minimax-m2-her": [
    {
      id: "minimax-m2-her-dialogue-first",
      content: (
        <>
          M2-her is dialogue-first: it excels at natural back-and-forth
          conversation. Keep your messages conversational and the model will
          match your energy with expressive, in-character responses.
        </>
      ),
    },
    {
      id: "minimax-m2-her-consistency",
      content: (
        <>
          This model is designed for character consistency. Once you establish a
          character&apos;s personality and tone, it maintains that voice
          reliably across long conversations.
        </>
      ),
    },
    {
      id: "minimax-m2-her-example-style",
      content: (
        <>
          M2-her learns from example dialogue. Your first few exchanges set the
          style and pacing for the whole conversation—start with the tone and
          length you want to see continued.
        </>
      ),
    },
  ],
  "moonshotai/kimi-k2.5": [
    {
      id: "kimi-k2.5-reasoning",
      content: (
        <>
          Kimi K2.5 has strong reasoning capabilities that help it maintain
          logical consistency in complex narratives. It excels at keeping track
          of plot details and character motivations across long conversations.
        </>
      ),
    },
    {
      id: "kimi-k2.5-simple-prompts",
      content: (
        <>
          This model responds best to clear, direct instructions. Simpler
          prompts often yield better results than overly detailed ones—let the
          model&apos;s reasoning fill in the gaps naturally.
        </>
      ),
    },
    {
      id: "kimi-k2.5-long-context",
      content: (
        <>
          With 256K context, Kimi K2.5 can maintain story coherence across very
          long sessions. It&apos;s particularly good at referencing earlier
          events and maintaining continuity.
        </>
      ),
    },
  ],
};

/**
 * Extracts the base model name from a full model ID.
 * Example: "nousresearch/hermes-4-70b:standard" -> "nousresearch/hermes-4-70b"
 */
function getBaseModelName(modelId: string): string {
  const colonIndex = modelId.lastIndexOf(":");
  if (colonIndex === -1) return modelId;
  return modelId.slice(0, colonIndex);
}

/**
 * Gets tips for a model by its full ID, matching against the base model name.
 * This way tips for "nousresearch/hermes-4-70b" apply to both
 * "nousresearch/hermes-4-70b:standard" and "nousresearch/hermes-4-70b:eco".
 */
export function getModelTips(modelId: string | null | undefined): ModelTip[] {
  if (!modelId) return [];
  const baseName = getBaseModelName(modelId);
  return MODEL_TIPS_BY_BASE[baseName] ?? [];
}
