export const personaGenerationModelIds = [
  "auto",
  "meta-llama/llama-4-maverick",
  "moonshotai/kimi-k2-0905",
  "x-ai/grok-3-mini",
  "x-ai/grok-4-fast",
  "sao10k/l3.3-euryale-70b",
  "inclusionai/ling-1t",
] as const;

export type PersonaGenerationModelId =
  (typeof personaGenerationModelIds)[number];

export type PersonaGenerationModelWeight = {
  id: PersonaGenerationModelId;
  priority: number; // higher means more likely to be selected as main/fallback
};

// Weighted list of models for persona generation flow
export const personaGenerationModelWeights: PersonaGenerationModelWeight[] = [
  {
    id: "auto",
    priority: 0,
  },
  {
    id: "meta-llama/llama-4-maverick",
    priority: 0.2,
  },
  {
    id: "moonshotai/kimi-k2-0905",
    priority: 0.5,
  },
  {
    id: "x-ai/grok-3-mini",
    priority: 0.3,
  },
  {
    id: "x-ai/grok-4-fast",
    priority: 0.5,
  },
  {
    id: "sao10k/l3.3-euryale-70b",
    priority: 0.3,
  },
  {
    id: "inclusionai/ling-1t",
    priority: 0.5,
  },
];

export const getPersonaGenerationModelIds = (): PersonaGenerationModelId[] =>
  personaGenerationModelWeights.map((m) => m.id);
