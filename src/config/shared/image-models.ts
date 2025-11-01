/**
 * Shared image model configuration
 * Used by both frontend and backend
 * All models defined here are available for selection
 */

export const IMAGE_MODELS = {
  // Cost 1 - Grouped by provider
  "black-forest-labs/flux-dev": {
    id: "black-forest-labs/flux-dev" as const,
    displayName: "FLUX Dev",
    cost: 1,
    width: 768,
    height: 1344,
  },
  "black-forest-labs/flux-krea-dev": {
    id: "black-forest-labs/flux-krea-dev" as const,
    displayName: "FLUX.1 Krea [dev]",
    cost: 1,
    width: 768,
    height: 1344,
  },
  "google/gemini-flash-image-2.5": {
    id: "google/gemini-flash-image-2.5" as const,
    displayName: "Gemini Flash Image 2.5",
    cost: 1,
    width: 768,
    height: 1344,
  },
  "qwen/qwen-image": {
    id: "qwen/qwen-image" as const,
    displayName: "Qwen Image",
    cost: 1,
    width: 768,
    height: 1344,
  },
  "seedream/seedream-3.0": {
    id: "seedream/seedream-3.0" as const,
    displayName: "SeeDream 3.0",
    cost: 1,
    width: 720,
    height: 1280,
  },
  // Cost 2 - Premium models
  "openai/gpt-image-1": {
    id: "openai/gpt-image-1" as const,
    displayName: "GPT Image 1",
    cost: 2,
    width: 1024,
    height: 1536,
  },
  "google/imagen-4-preview": {
    id: "google/imagen-4-preview" as const,
    displayName: "Google Imagen 4 Preview",
    cost: 2,
    width: 768,
    height: 1408,
  },
  "seedream/seedream-4.0": {
    id: "seedream/seedream-4.0" as const,
    displayName: "SeeDream 4.0",
    cost: 2,
    width: 1440,
    height: 2560,
  },
} as const;

export type ImageModelId = keyof typeof IMAGE_MODELS;

// Helper to get model cost
export const getModelCost = (modelId: ImageModelId): number => {
  return IMAGE_MODELS[modelId]?.cost ?? 1;
};

// Helper to get model dimensions
export const getModelDimensions = (
  modelId: ImageModelId
): { width: number; height: number } => {
  const model = IMAGE_MODELS[modelId];
  return {
    width: model?.width ?? 768,
    height: model?.height ?? 1344,
  };
};
