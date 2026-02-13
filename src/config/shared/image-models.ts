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
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
  },
  "black-forest-labs/flux-2-dev": {
    id: "black-forest-labs/flux-2-dev" as const,
    displayName: "FLUX.2 [dev]",
    cost: 1,
    width: 768,
    height: 1344,
    supportsReferenceImages: true,
    imagesPerGeneration: 1,
    new: true,
  },
  "black-forest-labs/flux-2-klein-4b": {
    id: "black-forest-labs/flux-2-klein-4b" as const,
    displayName: "FLUX.2 [klein] 4B",
    cost: 1,
    width: 768,
    height: 1344,
    supportsReferenceImages: true,
    imagesPerGeneration: 4,
    imagesPerGenerationWithReference: 2,
    new: true,
  },
  "black-forest-labs/flux-krea-dev": {
    id: "black-forest-labs/flux-krea-dev" as const,
    displayName: "FLUX.1 Krea [dev]",
    cost: 1,
    width: 768,
    height: 1344,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
  },
  "qwen/qwen-image": {
    id: "qwen/qwen-image" as const,
    displayName: "Qwen Image",
    cost: 1,
    width: 768,
    height: 1344,
    supportsReferenceImages: false,
    imagesPerGeneration: 2,
  },
  "qwen/qwen-image-edit-plus": {
    id: "qwen/qwen-image-edit-plus" as const,
    displayName: "Qwen Image Edit Plus",
    cost: 1,
    width: 768,
    height: 1344,
    supportsReferenceImages: true,
    imagesPerGeneration: 1,
    new: true,
    editOnly: true,
  },
  "seedream/seedream-3.0": {
    id: "seedream/seedream-3.0" as const,
    displayName: "SeeDream 3.0",
    cost: 1,
    width: 720,
    height: 1280,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
  },
  "prsna/bismuth-illustrious-mix-v5.0": {
    id: "prsna/bismuth-illustrious-mix-v5.0" as const,
    displayName: "Bismuth Illustrious Mix v5.0",
    cost: 1,
    width: 896,
    height: 1152,
    supportsReferenceImages: false,
    imagesPerGeneration: 2,
    beta: true,
    new: true,
  },
  "imagineart/imagineart-1.5": {
    id: "imagineart/imagineart-1.5" as const,
    displayName: "ImagineArt 1.5",
    cost: 1,
    width: 1728,
    height: 2304,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
    new: true,
  },
  "z-image/z-image-turbo": {
    id: "z-image/z-image-turbo" as const,
    displayName: "Z-Image-Turbo",
    cost: 1,
    width: 768,
    height: 1344,
    supportsReferenceImages: false,
    imagesPerGeneration: 2,
    new: true,
  },
  "prunaai/p-image": {
    id: "prunaai/p-image" as const,
    displayName: "P-Image",
    cost: 1,
    width: 768,
    height: 1376,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
    new: true,
  },
  // Cost 2 - Premium models
  "google/gemini-flash-image-2.5": {
    id: "google/gemini-flash-image-2.5" as const,
    displayName: "Gemini Flash Image 2.5",
    cost: 2,
    width: 768,
    height: 1344,
    supportsReferenceImages: true,
    imagesPerGeneration: 1,
  },
  "openai/gpt-image-1": {
    id: "openai/gpt-image-1" as const,
    displayName: "GPT Image 1",
    cost: 2,
    width: 1024,
    height: 1536,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
  },
  "google/imagen-4-preview": {
    id: "google/imagen-4-preview" as const,
    displayName: "Google Imagen 4 Preview",
    cost: 2,
    width: 768,
    height: 1408,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
  },
  "seedream/seedream-4.0": {
    id: "seedream/seedream-4.0" as const,
    displayName: "SeeDream 4.0",
    cost: 2,
    width: 1440,
    height: 2560,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
  },
  "seedream/seedream-4.5": {
    id: "seedream/seedream-4.5" as const,
    displayName: "SeeDream 4.5",
    cost: 2,
    width: 1440,
    height: 2560,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
    new: true,
  },
  "black-forest-labs/flux-2-pro": {
    id: "black-forest-labs/flux-2-pro" as const,
    displayName: "FLUX.2 [pro]",
    cost: 2,
    width: 768,
    height: 1344,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
    new: true,
  },
  "tencent/hunyuan-image-3.0": {
    id: "tencent/hunyuan-image-3.0" as const,
    displayName: "HunyuanImage-3.0",
    cost: 2,
    width: 896,
    height: 1152,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
    new: true,
  },
  "sourceful/riverflow-2-fast": {
    id: "sourceful/riverflow-2-fast" as const,
    displayName: "Riverflow 2 Fast",
    cost: 2,
    width: 720,
    height: 1280,
    supportsReferenceImages: true,
    imagesPerGeneration: 1,
    new: true,
    editOnly: true,
  },
} as const;

export type ImageModelId = keyof typeof IMAGE_MODELS;

export const DEFAULT_IMAGE_MODEL_ID: ImageModelId =
  "google/gemini-flash-image-2.5";

// Helper to get model cost
export const getModelCost = (modelId: ImageModelId): number => {
  return IMAGE_MODELS[modelId]?.cost ?? 1;
};

// Helper to check if model supports reference images
export const supportsReferenceImages = (modelId: ImageModelId): boolean => {
  return IMAGE_MODELS[modelId]?.supportsReferenceImages ?? false;
};

// Helper to get number of images per generation for a model
type GetImagesPerGenerationOptions = {
  withReferenceImages?: boolean;
};

export const getImagesPerGeneration = (
  modelId: ImageModelId,
  options?: GetImagesPerGenerationOptions
): number => {
  const model = IMAGE_MODELS[modelId];
  if (!model) return 1;

  if (
    options?.withReferenceImages &&
    "imagesPerGenerationWithReference" in model &&
    typeof model.imagesPerGenerationWithReference === "number"
  ) {
    return model.imagesPerGenerationWithReference;
  }

  return model.imagesPerGeneration ?? 1;
};

// Helper to get model display name with fallback to model ID
// Handles legacy/removed models by falling back to the model ID
export const getModelDisplayName = (
  modelId: string | null | undefined
): string => {
  if (!modelId) return "Unknown";
  const model = IMAGE_MODELS[modelId as ImageModelId];
  return model?.displayName ?? modelId;
};

// Helper to get model dimensions (width x height) with fallback
// Returns null if model not found or dimensions not available
export const getModelDimensions = (
  modelId: string | null | undefined
): { width: number; height: number } | null => {
  if (!modelId) return null;
  const model = IMAGE_MODELS[modelId as ImageModelId];
  if (!model) return null;
  return { width: model.width, height: model.height };
};

// Helper to check if model is in beta
export const isModelBeta = (modelId: ImageModelId): boolean => {
  const model = IMAGE_MODELS[modelId];
  return (model && "beta" in model && model.beta === true) ?? false;
};

// Helper to check if model is new
export const isModelNew = (modelId: ImageModelId): boolean => {
  const model = IMAGE_MODELS[modelId];
  return (model && "new" in model && model.new === true) ?? false;
};

// Helper to check if model is edit-only (requires reference images)
export const isModelEditOnly = (modelId: ImageModelId): boolean => {
  const model = IMAGE_MODELS[modelId];
  return (model && "editOnly" in model && model.editOnly === true) ?? false;
};

// Helper to get models available for image generation (excludes edit-only models)
export const getGenerationModels = () => {
  return Object.values(IMAGE_MODELS).filter(
    (model) => !("editOnly" in model && model.editOnly === true)
  );
};
