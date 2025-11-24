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

    const userBlock =
      args.user && args.user.enabled
        ? `\nUser character: ${args.user.name}\n${
            args.user.character ? processText(args.user.character) : ""
          }\n\n`
        : "";

    const scenarioBlock = args.scenario?.scenario_text?.trim()
      ? `\nScenario: ${processText(args.scenario.scenario_text)}\n\n`
      : "";

    return `You are playing the role of ${userName}. ${
      args.user?.character ? processText(args.user.character) : ""
    }

${scenarioBlock}

Play and act as the User and User character only. Never play or act as ${personaName}. Write the next message in the conversation. Use plain text for dialogues and write all actions and other things between asterisks.`;
  },
};

// Your roleplay partner is ${personaName}.
// ${personaName}'s profile:
// ${
//   args.character.gender === "other"
//     ? "They are"
//     : args.character.gender === "male"
//     ? "He is"
//     : "She is"
// } (${args.character.age}). ${args.character.gender}. Appearance: ${
//       args.character.appearance
//     }. Personality: ${args.character.personality}. Background: ${
//       args.character.background
//     }. Motivations: ${args.character.motivations}. Skills: ${
//       args.character.skills
//     }.
