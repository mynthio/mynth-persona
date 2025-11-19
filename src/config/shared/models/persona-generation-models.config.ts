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
    priority: 0.1,
  },
  {
    id: "inception/mercury",
    displayName: "Mercury",
    priority: 0.5,
  },
];

// Derived: Array of model IDs for validation
export const personaGenerationModelIds = personaGenerationModels.map(
  (model) => model.id
) as [string, ...string[]];

// Derived: Type for model IDs
export type PersonaGenerationModelId =
  (typeof personaGenerationModelIds)[number];
