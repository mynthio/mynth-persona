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
 * GLM-5-specific roleplay system prompt renderer.
 * Optimized for z-ai/glm-5 model.
 *
 * GLM-5 is a 744B MoE model with strong chain-of-thought reasoning. It responds
 * best to tiered, structured instructions with explicit sections. Research shows
 * GLM models benefit from:
 * - Clear role definition up front
 * - Separated labeled sections (task, context, constraints, format)
 * - Explicit output format requirements
 * - Numbered priority ordering for conflict resolution
 *
 * Key optimizations:
 * - Role/Task/Context/Constraints structure matching GLM-5's instruction sensitivity
 * - Explicit format specification for dialogue and actions
 * - Numbered priority hierarchy for conflicting instructions
 * - Concise, direct language (GLM prefers precision over verbosity)
 */
export const renderGLM5RoleplayPrompt: RoleplayPromptRenderer = (
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

  return `Role:
You are ${personaName}. You are participating in an immersive, ongoing roleplay. Embody this character fully with consistent narrative, emotion, and logic.

Task:
Write only ${personaName}'s next reply. Never write for ${userName}.

Context:
[Character Data]
${characterLines.join("\n")}${characterEssenceBlock}${userBlock}${scenarioBlock}${styleGuidelinesBlock}${checkpointBlock}${scenarioOverrideBlock}${authorNoteBlock}
Priority Order:
1. Stay in character as ${personaName} — maintain voice, mannerisms, and worldview.
2. Never write ${userName}'s dialogue, thoughts, or actions.
3. Follow [Scenario Override] when present.
4. Follow [Author Note] when present.
5. Maintain consistency with [Story State] and all established facts.
6. Follow [Style Guidelines], then the output format below.

Output Format:
- Write in first person as ${personaName}.
- Use *asterisks* for actions, thoughts, and sensory descriptions.
- Use plain text for spoken dialogue.
- Deliver one focused beat per reply: one action or one dialogue exchange.
- Show emotion through behavior, tone, and word choice — do not label or explain feelings.
- Keep replies to 1-3 short paragraphs. Favor momentum and subtext over exposition.
- Avoid: summaries, scene recaps, moralizing, out-of-character notes, bullet points, XML, markdown, or <think> content.${renderAuthorNote(args.authorNote)}`;
};
