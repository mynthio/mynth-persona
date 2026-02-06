import { PersonaVersionRoleplayData } from "@/schemas";
import {
  ChatSettingsUserPersona,
  ChatSettingsScenario,
} from "@/schemas/backend/chats/chat.schema";
import { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";

/**
 * Arguments for rendering roleplay system prompts
 */
export type RoleplayPromptArgs = {
  character: PersonaVersionRoleplayData;
  user?: ChatSettingsUserPersona | null;
  scenario?: ChatSettingsScenario | null;
  lastCheckpointSummary?: string | null;
  authorNote?: string | null;
};

/**
 * Renders the author note block to append at the end of system prompts.
 * Returns empty string if no note is provided.
 */
export function renderAuthorNote(note?: string | null): string {
  if (!note?.trim()) return "";
  return `\n\n<<AUTHOR NOTE: ${note.trim()}>>`;
}

/**
 * Style variation for roleplay prompts
 * - default: balanced, general-purpose roleplay
 * - concise: shorter responses, focused on action
 * - rich: detailed, descriptive prose
 * - dialogue: dialogue-heavy, minimal narration
 */
export type RoleplayPromptStyle = "default" | "concise" | "rich" | "dialogue";

/**
 * A simple function that renders a roleplay system prompt
 */
export type RoleplayPromptRenderer = (args: RoleplayPromptArgs) => string;

/**
 * Model ID type for prompt lookup
 */
export type ModelId = TextGenerationModelId | string;
