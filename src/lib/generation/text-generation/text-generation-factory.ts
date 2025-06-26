import { pipe, filter, toArray } from "@fxts/core";
import { TextGenerationBase } from "./text-generation-base";
import {
  textGenerationModels,
  textGenerationConfig,
} from "./text-generation-config";
import { ModelId } from "./types/model-id.type";
import { ModelQuality } from "./types/model-quality.type";
import { logger } from "@/lib/logger";

export class TextGenerationFactory {
  static byId(id: ModelId): TextGenerationBase {
    logger.debug({ id }, "Creating model by id");

    const ModelConstructor = textGenerationModels[id];

    if (!ModelConstructor) {
      throw new Error(`Model ${id} not found`);
    }

    return new ModelConstructor();
  }

  static byQuality(quality: ModelQuality): TextGenerationBase {
    return pipe(
      textGenerationConfig,
      filter((config) => config.quality === quality && !config.isDepracated),
      toArray,
      (models) => {
        if (models.length === 0) {
          throw new Error(`No models found for quality: ${quality}`);
        }
        return models[Math.floor(Math.random() * models.length)];
      },
      (model) => this.byId(model.id as ModelId)
    );
  }

  static forFreeUsers(): TextGenerationBase {
    return pipe(
      textGenerationConfig,
      filter((config) => config.isAvailableToFreeUsers && !config.isDepracated),
      toArray,
      (models) => {
        if (models.length === 0) {
          throw new Error("No models available for free users");
        }
        return models[Math.floor(Math.random() * models.length)];
      },
      (model) => this.byId(model.id as ModelId)
    );
  }
}
