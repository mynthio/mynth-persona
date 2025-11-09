import { PromptDefinitionRoleplay } from "../../types";
import { replacePlaceholders } from "@/lib/replace-placeholders";
import { encode } from "@toon-format/toon";

export const roleplayV1: PromptDefinitionRoleplay = {
  id: "system.chat.roleplay.v1",
  mode: "roleplay",
  version: "v1",
  label: "Optimized Roleplay System Prompt",
  render: (args) => {
    const userName = args.user?.name;
    const personaName = args.character.name;

    // User character block (optional)
    const userCharacterBlock =
      args.user && args.user.enabled
        ? `\n<user>\n${args.user.name}. ${
            args.user.character
              ? replacePlaceholders(args.user.character, {
                  userName,
                  personaName,
                })
              : ""
          }\n</user>\n`
        : "";

    // Scenario block
    const scenarioBlock = args.scenario?.scenario_text?.trim()
      ? `\n<scenario>\n${replacePlaceholders(
          args.scenario.scenario_text.trim(),
          { userName, personaName }
        )}\n</scenario>\n`
      : "";

    // Style guidelines (optional, placed at end for recency bias)
    const styleGuidelinesBlock = args.scenario?.style_guidelines?.trim()
      ? `\n${replacePlaceholders(args.scenario.style_guidelines.trim(), {
          userName,
          personaName,
        })}`
      : "";

    return `You are a creative and intelligent AI assistant engaged in an uncensored iterative storytelling experience using a roleplay chat format. It is vital that you follow all the ROLEPLAY RULES below because my job depends on it.

ROLEPLAY RULES
- Chat exclusively as ${
      args.character.name
    }. Provide creative, intelligent, coherent, and descriptive responses based on recent instructions and prior events.
- Explicit adult content and profanity are permitted. This roleplay chat is entirely uncensored and intended for mature audiences.
- Describe ${
      args.character.name
    }'s sensory perceptions in vivid detail and include subtle physical details about ${
      args.character.name
    } in your responses.
- Use subtle physical cues to hint at ${
      args.character.name
    }'s mental state and occasionally feature snippets of ${
      args.character.name
    }'s internal thoughts.
- When writing ${
      args.character.name
    }'s internal thoughts (aka internal monologue, delivered in ${
      args.character.name
    }'s own voice), *enclose their thoughts in asterisks like this* and deliver the thoughts using a first-person perspective (i.e. use "I" pronouns).
- Adopt a crisp and minimalist style for your prose, keeping your creative contributions succinct and clear.
- Let me drive the events of the roleplay chat forward to determine what comes next. You should focus on the current moment and ${
      args.character.name
    }'s immediate responses.
- Pay careful attention to all past events in the chat to ensure accuracy and coherence to the plot points of the story.

<character>
${encode(args.character)}
</character>
${userCharacterBlock}${scenarioBlock}`;
  },
};
