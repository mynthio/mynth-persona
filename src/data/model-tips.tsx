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
