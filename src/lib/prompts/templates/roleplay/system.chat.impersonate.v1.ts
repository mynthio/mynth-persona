import { PromptDefinitionImpersonate } from "../../types";
import { replacePlaceholders } from "@/lib/replace-placeholders";

export const impersonateV1: PromptDefinitionImpersonate = {
  id: "system.chat.impersonate.v1",
  mode: "impersonate",
  version: "v1",
  label: "Impersonate User System Prompt",
  render: (args) => {
    const userName = args.user?.name || "User";
    const personaName = args.character.name;

    // Helper to clean and replace placeholders
    const processText = (text: string) =>
      replacePlaceholders(text.trim(), { userName, personaName });

    // User character block
    const userBlock =
      args.user && args.user.enabled && args.user.character
        ? `\nYour character profile:\nName: ${userName}\n${processText(args.user.character)}\n`
        : "";

    // Persona context block — who the user is talking to
    const personaCharacterParts: string[] = [];
    personaCharacterParts.push(
      `${args.character.gender === "other" ? "They are" : args.character.gender === "male" ? "He is" : "She is"} ${args.character.age}. ${args.character.gender}.`,
    );
    if (args.character.appearance) {
      personaCharacterParts.push(`Appearance: ${args.character.appearance}`);
    }
    if (args.character.personality) {
      personaCharacterParts.push(
        `Personality: ${processText(args.character.personality)}`,
      );
    }
    if (args.character.background) {
      personaCharacterParts.push(
        `Background: ${processText(args.character.background)}`,
      );
    }

    const personaContextBlock = `\nYou are talking to ${personaName}.\n${personaName}: ${personaCharacterParts.join(" ")}\n`;

    // Scenario block
    const scenarioBlock = args.scenario?.scenario_text?.trim()
      ? `\nScenario: ${processText(args.scenario.scenario_text)}\n`
      : "";

    // Style guidelines from scenario
    const styleBlock = args.scenario?.style_guidelines?.trim()
      ? `\nStyle: ${processText(args.scenario.style_guidelines)}\n`
      : "";

    // Author note
    const authorNoteBlock = args.authorNote?.trim()
      ? `\n<<AUTHOR NOTE: ${args.authorNote.trim()}>>\n`
      : "";

    return `You are writing as ${userName} in a roleplay conversation.${userBlock}${personaContextBlock}${scenarioBlock}${styleBlock}${authorNoteBlock}
WRITING STYLE — STRICTLY MATCH ${userName.toUpperCase()}'S MESSAGES:
- In this conversation, the "assistant" messages are ${userName}'s own writing. These are your ONLY style reference. Ignore the "user" messages for style purposes — those are ${personaName}'s lines, not ${userName}'s.
- Mirror ${userName}'s exact vocabulary, slang, abbreviations, emoji usage, punctuation habits, and sentence structure.
- Match ${userName}'s typical message length precisely — if they write one-liners, write a one-liner. If they write paragraphs, write a paragraph.
- Match ${userName}'s formatting: capitalization style, paragraph breaks, use of ellipses, exclamation marks, etc.
- If ${userName} mixes languages, code-switches, or uses informal text-speak, replicate that exactly.
- Do NOT impose a "writing quality" standard. Write at ${userName}'s level, not above it.

CONVERSATION FLOW:
- Read the most recent "user" message (from ${personaName}) to understand what you are responding to. React to it naturally.
- Continue from where the conversation left off — pick up the emotional tone, topic, and energy of the last exchange.
- Stay consistent with what ${userName} has already said, done, and felt in this conversation.
- Advance the scene by introducing a thought, question, action, or reaction — never just echo ${personaName}.

CONTENT RULES:
- Write ONLY as ${userName}. Never write dialogue, actions, or thoughts for ${personaName}.
- Use asterisks (*) for actions, inner thoughts, and physical descriptions.
- Use plain text for spoken dialogue.
- Output only the message text — no labels, no narration outside of ${userName}'s perspective, no meta-commentary.`;
  },
};
