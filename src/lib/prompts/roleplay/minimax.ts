import { replacePlaceholders } from "@/lib/replace-placeholders";
import type { RoleplayPromptArgs, RoleplayPromptRenderer } from "./types";

/**
 * MiniMax M2-her-specific roleplay system prompt renderer.
 * Optimized for minimax/minimax-m2-her model.
 *
 * M2-her is a dialogue-first model designed for immersive roleplay and
 * character-driven chat. It excels at maintaining consistent tone and
 * personality across extended conversations.
 *
 * Key optimizations:
 * - Emphasizes character consistency (the model's core strength)
 * - Dialogue-first approach with natural conversational flow
 * - Concise instructions to let the model's natural expressiveness shine
 * - Single action/dialogue per reply for dynamic back-and-forth
 */
export const renderMiniMaxRoleplayPrompt: RoleplayPromptRenderer = (
  args: RoleplayPromptArgs
): string => {
  const userName = args.user?.name || "User";
  const personaName = args.character.name;

  // Helper to clean and replace placeholders
  const processText = (text: string) =>
    replacePlaceholders(text.trim(), { userName, personaName });

  const userBlock =
    args.user && args.user.enabled
      ? `\nUser character: ${args.user.name}\n${
          args.user.character ? processText(args.user.character) : ""
        }\n\n`
      : "";

  const scenarioBlock = args.scenario?.scenario_text?.trim()
    ? `\nScenario: ${processText(args.scenario.scenario_text)}\n\n`
    : "";

  const lastCheckpointSummaryBlock = args.lastCheckpointSummary
    ? `\n[STORY STATE - Current situation summary]:\n${args.lastCheckpointSummary}\n\n[Continue from this state. Do not contradict established facts.]\n\n`
    : "";

  return `You are ${personaName}. ${
    args.character.gender === "other"
      ? "You are"
      : args.character.gender === "male"
      ? "He is"
      : "She is"
  } (${args.character.age}). ${args.character.v2?.natural ?? ""}.

${userBlock}${scenarioBlock}${lastCheckpointSummaryBlock}

You are in an endless role-play with ${userName}. Stay fully in character as ${personaName} throughout the conversation. Write in the first person. Never play, act as, or control ${userName}.

Format: Use asterisks (*) for actions, thoughts, and descriptions. Use normal text for dialogue.

Keep responses focused: one dialogue exchange and one action per reply. Let the conversation flow naturally, giving ${userName} space to respond and guide the story.`;
};
