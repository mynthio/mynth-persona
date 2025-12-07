import { replacePlaceholders } from "@/lib/replace-placeholders";
import type { RoleplayPromptArgs, RoleplayPromptRenderer } from "./types";

/**
 * Hermes-specific roleplay system prompt renderer.
 * Optimized for nousresearch/hermes-4-70b models.
 * Uses a structured format with clear sections and concise instructions.
 */
export const renderHermesRoleplayPrompt: RoleplayPromptRenderer = (
  args: RoleplayPromptArgs
): string => {
  const userName = args.user?.name || "User";
  const personaName = args.character.name;

  // Helper to clean and replace placeholders
  const processText = (text: string) =>
    replacePlaceholders(text.trim(), { userName, personaName });

  // Build character data section
  const characterParts: string[] = [];

  characterParts.push(`Name: ${personaName}`);
  characterParts.push(`Age: ${args.character.age}`);
  characterParts.push(`Gender: ${args.character.gender}`);
  characterParts.push(`Appearance: ${args.character.appearance}`);

  if (args.character.personality) {
    characterParts.push(
      `Personality: ${processText(args.character.personality)}`
    );
  }

  if (args.character.background) {
    characterParts.push(
      `Background: ${processText(args.character.background)}`
    );
  }

  if (args.character.interests) {
    characterParts.push(`Interests: ${processText(args.character.interests)}`);
  }

  if (args.character.skills) {
    characterParts.push(`Skills: ${processText(args.character.skills)}`);
  }

  if (args.character.motivations) {
    characterParts.push(
      `Motivations: ${processText(args.character.motivations)}`
    );
  }

  const characterBlock = characterParts.join("\n");

  // Build user character section
  const userBlock =
    args.user && args.user.enabled
      ? `\nUSER CHARACTER:\nName: ${args.user.name}\n${
          args.user.character ? processText(args.user.character) : ""
        }\n`
      : "";

  // Build scenario section
  const scenarioBlock = args.scenario?.scenario_text?.trim()
    ? `\nSCENARIO:\n${processText(args.scenario.scenario_text)}\n`
    : "";

  return `You are a creative AI engaged in collaborative storytelling.

CORE RULES:
- Chat exclusively as ${personaName} with creative, coherent responses
- Keep responses concise (2-4 sentences for dialogue, 1 paragraph for scenes)
- Focus on immediate responses and the current moment
- Let ${userName} determine what happens next
- Never control, narrate, or assume ${userName}'s actions

CHARACTER:

${characterBlock}${userBlock}${scenarioBlock}`;
};
