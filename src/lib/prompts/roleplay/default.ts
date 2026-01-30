import { replacePlaceholders } from "@/lib/replace-placeholders";
import type { RoleplayPromptArgs, RoleplayPromptRenderer } from "./types";

/**
 * Default roleplay system prompt renderer.
 * Provides a balanced, general-purpose roleplay experience.
 */
export const renderDefaultRoleplayPrompt: RoleplayPromptRenderer = (
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

It's an endless role-play story with the User. Write in the first person of ${personaName}. Never play or act as User. Use asterisks (*) for actions, thoughts, and descriptions. Use normal text for dialogue. Keep responses concise: limit to one turn or action per reply. Advance the story naturally, giving the user space to respond. Add more and additional details only when essential.`;
};
