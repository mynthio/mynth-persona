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
    editOnly: true,
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
  },
  "imagineart/imagineart-1.5": {
    id: "imagineart/imagineart-1.5" as const,
    displayName: "ImagineArt 1.5",
    cost: 1,
    width: 1728,
    height: 2304,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
  },
  "z-image/z-image-turbo": {
    id: "z-image/z-image-turbo" as const,
    displayName: "Z-Image-Turbo",
    cost: 1,
    width: 768,
    height: 1344,
    supportsReferenceImages: false,
    imagesPerGeneration: 2,
  },
  "prunaai/p-image": {
    id: "prunaai/p-image" as const,
    displayName: "P-Image",
    cost: 1,
    width: 768,
    height: 1376,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
  },
  "xai/grok-imagine-image": {
    id: "xai/grok-imagine-image" as const,
    displayName: "Grok Imagine Image",
    cost: 1,
    width: 768,
    height: 1408,
    supportsReferenceImages: true,
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
  "alibaba/qwen-image-2.0": {
    id: "alibaba/qwen-image-2.0" as const,
    displayName: "Qwen Image 2.0",
    cost: 2,
    width: 768,
    height: 1344,
    supportsReferenceImages: true,
    imagesPerGeneration: 1,
    new: true,
  },
  "google/nano-banana-2": {
    id: "google/nano-banana-2" as const,
    displayName: "Nano Banana 2",
    cost: 2,
    width: 768,
    height: 1376,
    supportsReferenceImages: true,
    imagesPerGeneration: 1,
    new: true,
  },
  "klingai/kling-image-3.0": {
    id: "klingai/kling-image-3.0" as const,
    displayName: "Kling Image 3.0",
    cost: 2,
    width: 768,
    height: 1360,
    supportsReferenceImages: true,
    imagesPerGeneration: 1,
    new: true,
  },
  "recraft/recraft-v4": {
    id: "recraft/recraft-v4" as const,
    displayName: "Recraft V4",
    cost: 2,
    width: 768,
    height: 1344,
    supportsReferenceImages: false,
    imagesPerGeneration: 1,
    new: true,
  },
  "seedream/seedream-5.0-lite": {
    id: "seedream/seedream-5.0-lite" as const,
    displayName: "SeeDream 5.0 Lite",
    cost: 2,
    width: 1600,
    height: 2848,
    supportsReferenceImages: true,
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
  },
  "alibaba/qwen-image-2.0-pro": {
    id: "alibaba/qwen-image-2.0-pro" as const,
    displayName: "Qwen Image 2.0 Pro",
    cost: 3,
    width: 768,
    height: 1344,
    supportsReferenceImages: true,
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
  },
  "sourceful/riverflow-2-fast": {
    id: "sourceful/riverflow-2-fast" as const,
    displayName: "Riverflow 2 Fast",
    cost: 2,
    width: 720,
    height: 1280,
    supportsReferenceImages: true,
    imagesPerGeneration: 1,
    editOnly: true,
  },
} as const;

export type ImageModelId = keyof typeof IMAGE_MODELS;

// Ranked in March 2026 from current vendor docs plus live arena/leaderboard data.
// Creative mode favors broadly demanded, high-quality text-to-image defaults.
const CREATIVE_UI_MODEL_ORDER: readonly ImageModelId[] = [
  "google/gemini-flash-image-2.5",
  "google/nano-banana-2",
  "black-forest-labs/flux-2-pro",
  "openai/gpt-image-1",
  "xai/grok-imagine-image",
  "tencent/hunyuan-image-3.0",
  "google/imagen-4-preview",
  "alibaba/qwen-image-2.0-pro",
  "alibaba/qwen-image-2.0",
  "seedream/seedream-5.0-lite",
  "recraft/recraft-v4",
  "klingai/kling-image-3.0",
  "black-forest-labs/flux-2-dev",
  "black-forest-labs/flux-2-klein-4b",
  "qwen/qwen-image",
  "black-forest-labs/flux-krea-dev",
  "black-forest-labs/flux-dev",
  "imagineart/imagineart-1.5",
  "z-image/z-image-turbo",
  "prunaai/p-image",
  "prsna/bismuth-illustrious-mix-v5.0",
  "qwen/qwen-image-edit-plus",
  "sourceful/riverflow-2-fast",
] as const;

// Character mode uses reference images, so we bias toward stronger edit/multi-image models.
const REFERENCE_UI_MODEL_ORDER: readonly ImageModelId[] = [
  "google/gemini-flash-image-2.5",
  "google/nano-banana-2",
  "seedream/seedream-5.0-lite",
  "black-forest-labs/flux-2-pro",
  "xai/grok-imagine-image",
  "alibaba/qwen-image-2.0-pro",
  "alibaba/qwen-image-2.0",
  "klingai/kling-image-3.0",
  "black-forest-labs/flux-2-dev",
  "black-forest-labs/flux-2-klein-4b",
  "qwen/qwen-image-edit-plus",
  "sourceful/riverflow-2-fast",
  "qwen/qwen-image",
] as const;

export const DEFAULT_IMAGE_MODEL_ID: ImageModelId =
  "google/gemini-flash-image-2.5";

const CREATIVE_UI_MODEL_ORDER_INDEX = new Map(
  CREATIVE_UI_MODEL_ORDER.map((modelId, index) => [modelId, index] as const)
);

const REFERENCE_UI_MODEL_ORDER_INDEX = new Map(
  REFERENCE_UI_MODEL_ORDER.map((modelId, index) => [modelId, index] as const)
);

const sortModelsByUiOrder = (
  models: ReadonlyArray<(typeof IMAGE_MODELS)[ImageModelId]>,
  orderIndex: ReadonlyMap<ImageModelId, number>
) => {
  return [...models].sort((a, b) => {
    const aRank = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bRank = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return a.displayName.localeCompare(b.displayName);
  });
};

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

// Helper to get reference-capable models ordered for character/reference flows
export const getReferenceImageModels = () => {
  return sortModelsByUiOrder(
    Object.values(IMAGE_MODELS).filter((model) => model.supportsReferenceImages),
    REFERENCE_UI_MODEL_ORDER_INDEX
  );
};

// Helper to get models available for image generation (excludes edit-only models)
export const getGenerationModels = () => {
  return sortModelsByUiOrder(
    Object.values(IMAGE_MODELS).filter(
      (model) => !("editOnly" in model && model.editOnly === true)
    ),
    CREATIVE_UI_MODEL_ORDER_INDEX
  );
};
