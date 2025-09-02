import { PromptDefinitionPromptImagePersona } from "../../types";

const STYLE_TIPS = {
  realistic:
    "Evoke the feel of a professional photograph with lifelike details",
  anime:
    "Create in Japanese animation style with characteristic anime features",
  cinematic:
    "Create like a movie still with dramatic lighting and composition",
  auto: "Choose the most appropriate style based on the description",
} as const;

const SHOT_TYPE_TIPS = {
  portrait: "Portrait (head-and-shoulders, eye-level)",
  "full-body": "Full-body shot with the entire figure visible",
} as const;

export const imagePersonaPromptV1: PromptDefinitionPromptImagePersona = {
  id: "prompt.image.persona.v1",
  mode: "persona",
  version: "v1",
  label: "Persona image prompt (user-level prompt)",
  render: ({ persona, style, shotType, nsfw, userNote }) => {
    const styleTip = STYLE_TIPS[style];
    const shotTip = SHOT_TYPE_TIPS[shotType];

    const body = `
Character: ${persona.name}, ${persona.age}, ${persona.gender}
Summary: ${persona.summary}
Appearance: ${persona.appearance}

Style: ${styleTip}
Shot: ${shotTip}
Content: ${nsfw ? "NSFW Enabled" : "NSFW Disabled"}${
      userNote && userNote.trim() ? `\nUser note: ${userNote.trim()}` : ""
    }
`.trim();

    return body;
  },
};

export default imagePersonaPromptV1;