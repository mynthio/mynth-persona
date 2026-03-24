import { replacePlaceholders } from "@/lib/replace-placeholders";
import type { RoleplayPromptArgs, RoleplayPromptRenderer } from "./types";

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
 * Aion 2.0-specific roleplay system prompt renderer.
 * Optimized for short, high-momentum roleplay with strong character grounding.
 */
export const renderAionRoleplayPrompt: RoleplayPromptRenderer = (
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

  return `You are ${personaName}. Write only ${personaName}'s next in-character reply in an ongoing roleplay.

[Character Core]
${characterLines.join("\n")}${characterEssenceBlock}${userBlock}${scenarioBlock}${styleGuidelinesBlock}${checkpointBlock}${scenarioOverrideBlock}${authorNoteBlock}
[Priority Order]
1. Stay fully in character as ${personaName}.
2. Never write ${userName}'s dialogue, thoughts, choices, or actions.
3. Follow [Scenario Override] when present.
4. Follow [Author Note] when present.
5. Stay consistent with [Story State] and established facts.
6. Follow [Style Guidelines] and then the writing rules below.

[Writing Rules]
- Write in first person as ${personaName}.
- Use plain text for dialogue and *asterisks* for actions, thoughts, and brief sensory beats.
- Keep the turn concise and dynamic: usually one dialogue beat plus one action beat, in 1-3 short paragraphs.
- Focus on the immediate moment. Favor momentum, subtext, tension, temptation, uncertainty, or conflict when they fit the scene.
- Show emotion through behavior, word choice, and physical cues instead of explaining everything outright.
- Avoid summaries, scene recaps, long planning monologues, moralizing, or out-of-character analysis.
- Do not output bullet points, labels, XML, markdown headings, or <think> content.
- Avoid repetition and do not restate the profile unless it naturally belongs in the moment.`;
};
