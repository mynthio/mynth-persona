import { renderAionRoleplayPrompt } from "./aion";
import { renderDefaultRoleplayPrompt } from "./default";
import { renderGeminiRoleplayPrompt } from "./gemini";
import { renderGLM5RoleplayPrompt } from "./glm5";
import { renderHermesRoleplayPrompt } from "./hermes";
import { renderKimiRoleplayPrompt } from "./kimi";
import { renderMiMoRoleplayPrompt } from "./mimo";
import { renderMiniMaxRoleplayPrompt } from "./minimax";
import type {
  ModelId,
  RoleplayPromptArgs,
  RoleplayPromptRenderer,
  RoleplayPromptStyle,
} from "./types";

export type { RoleplayPromptArgs, RoleplayPromptStyle, RoleplayPromptRenderer };

/**
 * Model-specific prompt renderers.
 * Key is the internal model ID (e.g., "anthropic/claude-haiku-4.5:premium").
 * Add model-specific prompts here as needed.
 */
const promptsByModel: Partial<Record<string, RoleplayPromptRenderer>> = {
  "aion-labs/aion-2.0:standard": renderAionRoleplayPrompt,
  "aion-labs/aion-2.0:eco": renderAionRoleplayPrompt,
  "nousresearch/hermes-4-70b:standard": renderHermesRoleplayPrompt,
  "nousresearch/hermes-4-70b:eco": renderHermesRoleplayPrompt,
  "google/gemini-2.5-flash-preview-09-2025:standard":
    renderGeminiRoleplayPrompt,
  "google/gemini-3.1-pro-preview:premium": renderGeminiRoleplayPrompt,
  "google/gemini-3-flash-preview:standard": renderGeminiRoleplayPrompt,
  "minimax/minimax-m2-her:eco": renderMiniMaxRoleplayPrompt,
  "minimax/minimax-m2-her:standard": renderMiniMaxRoleplayPrompt,
  "minimax/minimax-m2.7:eco": renderMiniMaxRoleplayPrompt,
  "minimax/minimax-m2.7:standard": renderMiniMaxRoleplayPrompt,
  "moonshotai/kimi-k2.5:standard": renderKimiRoleplayPrompt,
  "xiaomi/mimo-v2-pro:standard": renderMiMoRoleplayPrompt,
  "z-ai/glm-5:standard": renderGLM5RoleplayPrompt,
  // Example: Add model-specific prompts here
  // "anthropic/claude-haiku-4.5:premium": renderClaudeRoleplayPrompt,
};

/**
 * Style-specific prompt renderers (future use).
 * Key is the style name.
 */
const promptsByStyle: Partial<
  Record<RoleplayPromptStyle, RoleplayPromptRenderer>
> = {
  default: renderDefaultRoleplayPrompt,
  // Future: Add style variations here
  // concise: renderConciseRoleplayPrompt,
  // rich: renderRichRoleplayPrompt,
  // dialogue: renderDialogueRoleplayPrompt,
};

/**
 * Model + style specific overrides (future use).
 * Key format: "modelId:style"
 */
const promptsByModelAndStyle: Partial<Record<string, RoleplayPromptRenderer>> =
  {
    // Example: Model-specific style overrides
    // "anthropic/claude-haiku-4.5:premium:concise": renderClaudeConcisePrompt,
  };

/**
 * Get the system prompt renderer for roleplay.
 *
 * Resolution order:
 * 1. Model + style specific override (if both provided)
 * 2. Model-specific prompt (if modelId provided)
 * 3. Style-specific prompt (if style provided)
 * 4. Default prompt
 *
 * @param modelId - Optional internal model ID (e.g., "anthropic/claude-haiku-4.5:premium")
 * @param style - Optional style variation (default: "default")
 * @returns The prompt renderer function
 */
export function getSystemPromptRendererForRoleplay(
  modelId?: ModelId,
  style?: RoleplayPromptStyle,
): RoleplayPromptRenderer {
  const effectiveStyle = style ?? "default";

  // 1. Check for model + style specific override
  if (modelId) {
    const modelStyleKey = `${modelId}:${effectiveStyle}`;
    const modelStylePrompt = promptsByModelAndStyle[modelStyleKey];
    if (modelStylePrompt) {
      return modelStylePrompt;
    }
  }

  // 2. Check for model-specific prompt
  if (modelId) {
    const modelPrompt = promptsByModel[modelId];
    if (modelPrompt) {
      return modelPrompt;
    }
  }

  // 3. Check for style-specific prompt
  const stylePrompt = promptsByStyle[effectiveStyle];
  if (stylePrompt) {
    return stylePrompt;
  }

  // 4. Fall back to default
  return renderDefaultRoleplayPrompt;
}

/**
 * Render a roleplay system prompt directly.
 * Convenience function that combines getting the renderer and calling it.
 *
 * @param args - The roleplay prompt arguments
 * @param modelId - Optional internal model ID
 * @param style - Optional style variation
 * @returns The rendered system prompt string
 */
export function renderRoleplaySystemPrompt(
  args: RoleplayPromptArgs,
  modelId?: ModelId,
  style?: RoleplayPromptStyle,
): string {
  const renderer = getSystemPromptRendererForRoleplay(modelId, style);
  return renderer(args);
}

// Re-export the default renderer for direct access if needed
export {
  renderAionRoleplayPrompt,
  renderDefaultRoleplayPrompt,
  renderGeminiRoleplayPrompt,
  renderGLM5RoleplayPrompt,
  renderHermesRoleplayPrompt,
  renderKimiRoleplayPrompt,
  renderMiMoRoleplayPrompt,
  renderMiniMaxRoleplayPrompt,
};
