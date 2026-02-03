export type PersonaGenerationModel = {
  id: string;
  displayName: string;
  priority: number; // higher means more likely to be selected as main/fallback
};

// Single source of truth for persona generation models
export const personaGenerationModels: PersonaGenerationModel[] = [
  {
    id: "auto",
    displayName: "Auto",
    priority: 0,
  },
  {
    id: "thedrummer/unslopnemo-12b",
    displayName: "Unslopnemo 12B",
    priority: 0.5,
  },
  {
    id: "meta-llama/llama-4-maverick",
    displayName: "Llama 4 Maverick",
    priority: 0.2,
  },
  {
    id: "moonshotai/kimi-k2-0905",
    displayName: "Kimi K2",
    priority: 0.5,
  },
  {
    id: "moonshotai/kimi-k2.5",
    displayName: "Kimi K2.5",
    priority: 0.7,
  },
  {
    id: "x-ai/grok-3-mini",
    displayName: "Grok 3 Mini",
    priority: 0.2,
  },
  {
    id: "x-ai/grok-4-fast",
    displayName: "Grok 4 Fast",
    priority: 0.1,
  },
  {
    id: "sao10k/l3.3-euryale-70b",
    displayName: "L3.3 Euryale 70B",
    priority: 0.3,
  },
  {
    id: "openai/gpt-5-mini",
    displayName: "GPT-5 Mini",
    priority: 0.4,
  },
  {
    id: "z-ai/glm-4.6",
    displayName: "GLM 4.6",
    priority: 0.2,
  },
  {
    id: "inception/mercury",
    displayName: "Mercury",
    priority: 0.2,
  },
  {
    id: "amazon/nova-2-lite-v1",
    displayName: "Nova 2 Lite",
    priority: 0.0,
  },
  {
    id: "nex-agi/deepseek-v3.1-nex-n1:free",
    displayName: "DeepSeek V3.1 Nex N1",
    priority: 0.0,
  },
  {
    id: "tngtech/tng-r1t-chimera",
    displayName: "TNG R1T Chimera",
    priority: 0.0,
  },
  {
    id: "google/gemini-3-pro-preview",
    displayName: "Gemini 3 Pro Preview",
    priority: 0.0,
  },
];

// Derived: Array of model IDs for validation
export const personaGenerationModelIds = personaGenerationModels.map(
  (model) => model.id
) as [string, ...string[]];

// Derived: Type for model IDs
export type PersonaGenerationModelId =
  (typeof personaGenerationModelIds)[number];
