import { ModelQuality } from "./model-quality.type";

export type ImageGenerationConfigModel = {
  id: string;
  quality: ModelQuality;
  isAvailableToFreeUsers: boolean;
  isDepracated: boolean;
};
