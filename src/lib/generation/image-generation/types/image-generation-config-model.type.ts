import { ModelQuality } from "./types/model-quality.type";

export type ImageGenerationConfigModel = {
  id: string;
  quality: ModelQuality;
  isAvailableToFreeUsers: boolean;
  isDepracated: boolean;
};
