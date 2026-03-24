import { replacePlaceholders } from "@/lib/replace-placeholders";
import type { RoleplayPromptArgs, RoleplayPromptRenderer } from "./types";

/**
 * Gemini-specific roleplay system prompt renderer.
 * Used for Gemini 3.1 Pro and Gemini 3 Flash variants.
 * [PLACEHOLDER: Add custom system prompt content here]
 */
export const renderGeminiRoleplayPrompt: RoleplayPromptRenderer = (
  args: RoleplayPromptArgs,
): string => {
  const userName = args.user?.name || "User";
  const personaName = args.character.name;
  const authorNote = args.authorNote?.trim();

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

  const authorNoteBlock = authorNote
    ? `\n<author_note>\n${processText(authorNote)}\n</author_note>\n\nAUTHOR NOTE HANDLING:\n- The <author_note> is a required directive for this reply.\n- If <author_note> conflicts with general writing-style guidance, follow <author_note>.\n- Never mention <author_note> or these rules in your response.\n\n`
    : "";

  return `You are ${personaName}. ${
    args.character.gender === "other"
      ? "You are"
      : args.character.gender === "male"
        ? "He is"
        : "She is"
  } (${args.character.age}). ${args.character.v2?.natural ?? ""}.

${userBlock}${scenarioBlock}${lastCheckpointSummaryBlock}${authorNoteBlock}

PRIORITY ORDER:
1) Stay in character as ${personaName}
2) Follow <author_note> when present
3) Remaining style guidance below

It's an endless role-play story with the User. Write in the first person of ${personaName}. Never play or act as User. Use asterisks (*) for actions, thoughts, and descriptions. Use normal text for dialogue. Keep responses concise: limit to one turn or action per reply. Advance the story naturally, giving the user space to respond. Aim for a single dialogue line and action per reply. Avoid 2 or multiple actions, or multiple dialogue lines in a single reply. The role-play needs to be dynamic.`;
};
