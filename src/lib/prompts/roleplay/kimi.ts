import { replacePlaceholders } from "@/lib/replace-placeholders";
import type { RoleplayPromptArgs, RoleplayPromptRenderer } from "./types";

/**
 * Kimi K2.5-specific roleplay system prompt renderer.
 * Optimized for moonshotai/kimi-k2.5 model.
 *
 * Kimi K2.5 is a native multimodal model with strong reasoning capabilities
 * and 256K context window. It benefits from:
 * - Clear, direct instructions (simpler prompts work better)
 * - Structured character information for reasoning consistency
 * - Emphasis on logical coherence and character depth
 * - Single-turn focus to leverage its deliberate response style
 */
export const renderKimiRoleplayPrompt: RoleplayPromptRenderer = (
  args: RoleplayPromptArgs,
): string => {
  const userName = args.user?.name || "User";
  const personaName = args.character.name;

  // Helper to clean and replace placeholders
  const processText = (text: string) =>
    replacePlaceholders(text.trim(), { userName, personaName });

  // Build character profile
  const characterParts: string[] = [];
  characterParts.push(`Name: ${personaName}`);
  characterParts.push(`Age: ${args.character.age}`);
  characterParts.push(`Gender: ${args.character.gender}`);

  if (args.character.appearance) {
    characterParts.push(`Appearance: ${args.character.appearance}`);
  }

  if (args.character.personality) {
    characterParts.push(
      `Personality: ${processText(args.character.personality)}`,
    );
  }

  if (args.character.background) {
    characterParts.push(
      `Background: ${processText(args.character.background)}`,
    );
  }

  const characterProfile = characterParts.join("\n");

  // Natural description if available
  const naturalDescription = args.character.v2?.natural
    ? `\n${args.character.v2.natural}`
    : "";

  const userBlock =
    args.user && args.user.enabled
      ? `\n[User Character]\nName: ${args.user.name}\n${
          args.user.character ? processText(args.user.character) : ""
        }\n`
      : "";

  const scenarioBlock = args.scenario?.scenario_text?.trim()
    ? `\n[Scenario]\n${processText(args.scenario.scenario_text)}\n`
    : "";

  const lastCheckpointSummaryBlock = args.lastCheckpointSummary
    ? `\n[Story State]\n${args.lastCheckpointSummary}\n\nContinue from this state. Maintain consistency with established facts.\n`
    : "";

  return `You are ${personaName}, engaging in an immersive roleplay.

[Character Profile]
${characterProfile}${naturalDescription}
${userBlock}${scenarioBlock}${lastCheckpointSummaryBlock}
[Instructions]
- Write as ${personaName} in first person
- Use asterisks (*) for actions and descriptions
- Use plain text for dialogue
- Keep single paragraph per response
- Keep responses focused: one action or dialogue exchange per turn
- Never control or speak for ${userName}
- Stay in character and advance the story naturally`;
};
