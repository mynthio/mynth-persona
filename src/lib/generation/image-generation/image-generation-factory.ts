import { pipe, filter, map, flat, toArray, sort } from "@fxts/core";
import { ImageGenerationBase } from "./image-generation-base";
import {
  imageModelsConfig,
  ProviderHandler,
  qualityConfig,
  ModelQuality,
} from "./image-generation-config";
import { UniversalModelId } from "./constants";
import { logger } from "@/lib/logger";

// Helper function to shuffle array using sort with random comparator
const shuffleArray = <T>(arr: T[]): T[] => sort(() => Math.random() - 0.5, arr);

export class ImageGenerationFactory {
  /**
   * Get model handler by quality level (randomly selected from available models)
   */
  static byQuality(quality: ModelQuality): ImageGenerationBase {
    logger.debug({ quality }, "Getting model handler by quality");

    const availableProviders = pipe(
      qualityConfig[quality] || [],
      filter((modelId: UniversalModelId) => {
        const config = imageModelsConfig[modelId];
        return config && !config.isDeprecated;
      }),
      map((modelId: UniversalModelId) =>
        pipe(
          imageModelsConfig[modelId].providersHandlers,
          filter((provider: ProviderHandler) => provider.isEnabled)
        )
      ),
      flat,
      toArray
    );

    if (availableProviders.length === 0) {
      throw new Error(`No available providers found for quality: ${quality}`);
    }

    // Randomly select a provider
    const shuffledProviders = shuffleArray(availableProviders);
    const selectedProvider = shuffledProviders[0];

    logger.debug(
      {
        selectedProvider: selectedProvider.modelClass.name,
        quality,
      },
      "Selected provider for quality"
    );

    return new selectedProvider.modelClass();
  }

  /**
   * Get model handler by universal model ID (randomly selected from available providers)
   */
  static byModelId(modelId: UniversalModelId): ImageGenerationBase {
    logger.debug({ modelId }, "Getting model handler by model ID");

    const modelConfig = imageModelsConfig[modelId];
    if (!modelConfig) {
      throw new Error(`No configuration found for model: ${modelId}`);
    }

    if (modelConfig.isDeprecated) {
      throw new Error(`Model ${modelId} is deprecated`);
    }

    const enabledProviders = pipe(
      modelConfig.providersHandlers,
      filter((provider: ProviderHandler) => provider.isEnabled),
      toArray
    );

    if (enabledProviders.length === 0) {
      throw new Error(`No available providers found for model: ${modelId}`);
    }

    // Randomly select a provider
    const shuffledProviders = shuffleArray(enabledProviders);
    const selectedProvider = shuffledProviders[0];

    logger.debug(
      {
        selectedProvider: selectedProvider.modelClass.name,
        modelId,
      },
      "Selected provider for model ID"
    );

    return new selectedProvider.modelClass();
  }
}
