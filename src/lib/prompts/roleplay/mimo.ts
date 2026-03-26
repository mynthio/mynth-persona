import { replacePlaceholders } from "@/lib/replace-placeholders";
import type { RoleplayPromptArgs, RoleplayPromptRenderer } from "./types";
import { renderAuthorNote } from "./types";

function pushLine(lines: string[], label: string, value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  lines.push(`${label}: ${trimmed}`);
}

function renderOptionalBlock(title: string, value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return `\n[${title}]\n${trimmed}\n`;
}

/**
 * MiMo V2 Pro-specific roleplay system prompt renderer.
 * Optimized for xiaomi/mimo-v2-pro model.
 *
 * MiMo V2 Pro is a reasoning-focused agent model with 1M context and low
 * hallucination. It responds well to structured prompts with clear labeled
 * sections, explicit task framing, and concise constraints.
 *
 * Key optimizations:
 * - Structured character data with labeled fields (model handles structured input well)
 * - Clear priority ordering for conflicting instructions
 * - Explicit constraints to leverage the model's strong instruction-following
 * - Concise writing rules to keep the reasoning-focused model on track for creative output
 */
export const renderMiMoRoleplayPrompt: RoleplayPromptRenderer = (
  args: RoleplayPromptArgs,
): string => {
  const userName = args.user?.name || "User";
  const personaName = args.character.name;
  const structured = args.character.v2?.structured;

  const processText = (text: string) =>
    replacePlaceholders(text.trim(), { userName, personaName });

  const characterLines: string[] = [];
  pushLine(characterLines, "Name", personaName);
  pushLine(characterLines, "Age", args.character.age);
  pushLine(characterLines, "Gender", args.character.gender);
  pushLine(
    characterLines,
    "Appearance",
    structured ? processText(structured.appearance) : args.character.appearance,
  );
  pushLine(
    characterLines,
    "Speech",
    structured && processText(structured.speech),
  );
  pushLine(
    characterLines,
    "Personality",
    structured
      ? processText(structured.personality)
      : args.character.personality
        ? processText(args.character.personality)
        : null,
  );
  pushLine(
    characterLines,
    "Background",
    structured
      ? processText(structured.background)
      : args.character.background
        ? processText(args.character.background)
        : null,
  );
  pushLine(
    characterLines,
    "Quirks",
    structured && processText(structured.quirks),
  );
  pushLine(
    characterLines,
    "Relationships",
    structured && processText(structured.relationships),
  );
  pushLine(
    characterLines,
    "Goals",
    structured && processText(structured.goals),
  );
  pushLine(
    characterLines,
    "Interests",
    args.character.interests ? processText(args.character.interests) : null,
  );
  pushLine(
    characterLines,
    "Skills",
    args.character.skills ? processText(args.character.skills) : null,
  );
  pushLine(
    characterLines,
    "Motivations",
    args.character.motivations ? processText(args.character.motivations) : null,
  );

  const userBlock =
    args.user && args.user.enabled
      ? `\n[User Character]\nName: ${args.user.name}\n${
          args.user.character ? processText(args.user.character) : ""
        }\n`
      : "";

  const scenarioBlock = renderOptionalBlock(
    "Scenario",
    args.scenario?.scenario_text
      ? processText(args.scenario.scenario_text)
      : null,
  );
  const styleGuidelinesBlock = renderOptionalBlock(
    "Style Guidelines",
    args.scenario?.style_guidelines
      ? processText(args.scenario.style_guidelines)
      : null,
  );
  const checkpointBlock = renderOptionalBlock(
    "Story State",
    args.lastCheckpointSummary ? args.lastCheckpointSummary : null,
  );
  const scenarioOverrideBlock = renderOptionalBlock(
    "Scenario Override",
    args.scenario?.system_prompt_override
      ? processText(args.scenario.system_prompt_override)
      : null,
  );
  const authorNoteBlock = renderOptionalBlock(
    "Author Note",
    args.authorNote ? processText(args.authorNote) : null,
  );
  const characterEssenceBlock = renderOptionalBlock(
    "Character Essence",
    args.character.v2?.natural ? processText(args.character.v2.natural) : null,
  );

  return `Role: You are ${personaName}. Write only ${personaName}'s next reply in an ongoing roleplay.

Context:
[Character]
${characterLines.join("\n")}${characterEssenceBlock}${userBlock}${scenarioBlock}${styleGuidelinesBlock}${checkpointBlock}${scenarioOverrideBlock}${authorNoteBlock}
Guidelines:
1. Stay fully in character as ${personaName} at all times.
2. Never write ${userName}'s dialogue, thoughts, choices, or actions.
3. Follow [Scenario Override] when present.
4. Follow [Author Note] when present.
5. Stay consistent with [Story State] and established facts.
6. Follow [Style Guidelines] and then the writing rules below.

Constraints:
- Write in first person as ${personaName}.
- Use plain text for dialogue and *asterisks* for actions, thoughts, and brief sensory beats.
- Keep replies concise: one dialogue beat plus one action beat, in 1-3 short paragraphs.
- Focus on the immediate moment. Show emotion through behavior and word choice, not explanation.
- Avoid summaries, recaps, monologues, moralizing, or out-of-character notes.
- Do not output bullet points, labels, XML, markdown headings, or <think> tags.
- Avoid repetition and do not restate the character profile unless it naturally fits the moment.${renderAuthorNote(args.authorNote)}`;
};
