import { pipe, filter, toArray } from "@fxts/core";
import { ImageGenerationBase } from "./image-generation-base";
import {
  imageGenerationModels,
  imageGenerationConfig,
} from "./image-generation-config";
import { ModelQuality } from "./types/model-quality.type";
import { logger } from "@/lib/logger";

export class ImageGenerationFactory {
  static byId(id: string): ImageGenerationBase {
    logger.debug({ id }, "Creating model by id");

    const ModelConstructor = imageGenerationModels[id];

    if (!ModelConstructor) {
      throw new Error(`Model ${id} not found`);
    }

    return new ModelConstructor();
  }

  static byQuality(quality: ModelQuality): ImageGenerationBase {
    return pipe(
      imageGenerationConfig,
      filter((config) => config.quality === quality && !config.isDepracated),
      toArray,
      (models) => {
        if (models.length === 0) {
          throw new Error(`No models found for quality: ${quality}`);
        }
        return models[Math.floor(Math.random() * models.length)];
      },
      (model) => this.byId(model.id as string)
    );
  }

  static forFreeUsers(): ImageGenerationBase {
    return pipe(
      imageGenerationConfig,
      filter((config) => config.isAvailableToFreeUsers && !config.isDepracated),
      toArray,
      (models) => {
        if (models.length === 0) {
          throw new Error("No models available for free users");
        }
        return models[Math.floor(Math.random() * models.length)];
      },
      (model) => this.byId(model.id as string)
    );
  }
}
