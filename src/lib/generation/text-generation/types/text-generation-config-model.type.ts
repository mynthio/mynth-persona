import { ModelQuality } from "./model-quality.type";

export type TextGenerationConfigModel = {
  // Internal ID of the model, used in a database etc.
  id: string;

  // Is model available for anonymous/free users? We try to pick the cheapest ones here, just for the preview.
  isAvailableToFreeUsers: boolean;

  // Is model depracated? We can still keep reference for models that are in DB, but we won't use them for new generations.
  isDepracated: boolean;

  // Used for model quality. Different quality can cost differently.
  quality: ModelQuality;
};
