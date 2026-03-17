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
    id: "moonshotai/kimi-k2-0905",
    displayName: "Kimi K2",
    priority: 0.4,
  },
  {
    id: "moonshotai/kimi-k2.5",
    displayName: "Kimi K2.5",
    priority: 0.65,
  },
  {
    id: "x-ai/grok-4.20-multi-agent-beta",
    displayName: "Grok 4.20 Beta",
    priority: 0.18,
  },
  {
    id: "x-ai/grok-4-fast",
    displayName: "Grok 4 Fast",
    priority: 0.12,
  },
  {
    id: "sao10k/l3.3-euryale-70b",
    displayName: "L3.3 Euryale 70B",
    priority: 0.28,
  },
  {
    id: "z-ai/glm-4.6",
    displayName: "GLM 4.6",
    priority: 0.18,
  },
  {
    id: "aion-labs/aion-2.0",
    displayName: "Aion 2.0",
    priority: 0.16,
  },
  {
    id: "google/gemini-3.1-pro-preview",
    displayName: "Gemini 3.1 Pro Preview",
    priority: 0.05,
  },
  {
    id: "bytedance-seed/seed-2.0-lite",
    displayName: "Seed 2.0 Lite",
    priority: 0.02,
  },
];

// Derived: Array of model IDs for validation
export const personaGenerationModelIds = personaGenerationModels.map(
  (model) => model.id
) as [string, ...string[]];

// Derived: Type for model IDs
export type PersonaGenerationModelId =
  (typeof personaGenerationModelIds)[number];
