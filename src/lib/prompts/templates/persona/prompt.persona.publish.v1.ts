import { PromptDefinitionPromptPersonaPublish } from "../../types";

export const personaPublishPromptV1: PromptDefinitionPromptPersonaPublish = {
  id: "prompt.persona.publish.v1",
  mode: "publish",
  version: "v1",
  label: "Persona publish user prompt",
  render: ({ persona }) => {
    // TODO: Implement publish user prompt logic
    return `# Character
    
${JSON.stringify(persona)}`;
  },
};

export default personaPublishPromptV1;
