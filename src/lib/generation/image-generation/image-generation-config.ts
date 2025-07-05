import { CloudflareLykonDreamshaper8Lcm } from "./cloudflare/cloudflare-lykon-dreamshaper-8-lcm";
import { CloudflareBytedanceStableDiffusionXLLightning } from "./cloudflare/cloudflare-bytedance-stable-diffusion-xl-lightning";
import { ImageGenerationBase } from "./image-generation-base";
import { ReplicateBlackForestLabsFluxSchnell } from "./replicate/replicate-black-forest-labs-flux-schnell";
import { RunwareFluxSchnell } from "./runware/runware-flux-schnell";
import {
  FLUX_SCHNELL_MODEL_ID,
  DREAMSHAPER_8_LCM_MODEL_ID,
  STABLE_DIFFUSION_XL_LIGHTNING_MODEL_ID,
  UniversalModelId,
} from "./constants";

// Provider handler configuration
export type ProviderHandler = {
  modelClass: new () => ImageGenerationBase;
  isEnabled: boolean;
  priority: number; // Lower number = higher priority
};

// Model configuration organized by universal MODEL_ID
export type ModelConfig = {
  isDeprecated: boolean;
  providersHandlers: ProviderHandler[];
};

// Main configuration organized by universal MODEL_IDs
export const imageModelsConfig: Record<UniversalModelId, ModelConfig> = {
  [FLUX_SCHNELL_MODEL_ID]: {
    isDeprecated: false,
    providersHandlers: [
      {
        modelClass: RunwareFluxSchnell,
        isEnabled: true,
        priority: 1, // Primary provider
      },
    ],
  },
  [DREAMSHAPER_8_LCM_MODEL_ID]: {
    isDeprecated: true,
    providersHandlers: [
      {
        modelClass: CloudflareLykonDreamshaper8Lcm,
        isEnabled: false,
        priority: 1,
      },
    ],
  },
  [STABLE_DIFFUSION_XL_LIGHTNING_MODEL_ID]: {
    isDeprecated: true,
    providersHandlers: [
      {
        modelClass: CloudflareBytedanceStableDiffusionXLLightning,
        isEnabled: true,
        priority: 1,
      },
    ],
  },
};

// Quality configuration - qualities as properties with arrays of MODEL_IDs
export const qualityConfig = {
  low: [
    FLUX_SCHNELL_MODEL_ID,
    DREAMSHAPER_8_LCM_MODEL_ID,
    STABLE_DIFFUSION_XL_LIGHTNING_MODEL_ID,
  ],
  medium: [
    // Add medium quality models here when available
  ],
  best: [
    // Add best quality models here when available
  ],
} as const;

export type ModelQuality = keyof typeof qualityConfig;
