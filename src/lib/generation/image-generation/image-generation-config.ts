import { ImageGenerationBase } from "./image-generation-base";
import { RunwareFluxSchnell } from "./runware/runware-flux-schnell";
import { RunwareFluxDev } from "./runware/runware-flux-dev";
import { RunwareFlux1Pro } from "./runware/runware-flux-1-pro";
import { RunwareFlux11ProUltra } from "./runware/runware-flux-1.1-pro-ultra";
import { RunwareSeedream3 } from "./runware/runware-seedream-3";
import {
  FLUX_SCHNELL_MODEL_ID,
  FLUX_DEV_MODEL_ID,
  FLUX_1_PRO_MODEL_ID,
  FLUX_1_1_PRO_ULTRA_MODEL_ID,
  SEEDREAM_3_MODEL_ID,
  UniversalModelId,
  BISMUTH_ILLUSTRIOUS_MIX_V4_0_MODEL_ID,
} from "./constants";
import { RunwareBismuthIllustriousMixV40 } from "./runware/runware-bismuth-illustrious-mix-v-4-0";

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
  [FLUX_DEV_MODEL_ID]: {
    isDeprecated: false,
    providersHandlers: [
      {
        modelClass: RunwareFluxDev,
        isEnabled: true,
        priority: 1, // Primary provider
      },
    ],
  },
  [FLUX_1_PRO_MODEL_ID]: {
    isDeprecated: false,
    providersHandlers: [
      {
        modelClass: RunwareFlux1Pro,
        isEnabled: true,
        priority: 1, // Primary provider
      },
    ],
  },
  [FLUX_1_1_PRO_ULTRA_MODEL_ID]: {
    isDeprecated: false,
    providersHandlers: [
      {
        modelClass: RunwareFlux11ProUltra,
        isEnabled: true,
        priority: 1, // Primary provider
      },
    ],
  },
  [SEEDREAM_3_MODEL_ID]: {
    isDeprecated: false,
    providersHandlers: [
      {
        modelClass: RunwareSeedream3,
        isEnabled: true,
        priority: 1, // Primary provider
      },
    ],
  },
  [BISMUTH_ILLUSTRIOUS_MIX_V4_0_MODEL_ID]: {
    isDeprecated: false,
    providersHandlers: [
      {
        modelClass: RunwareBismuthIllustriousMixV40,
        isEnabled: true,
        priority: 1, // Primary provider
      },
    ],
  },
};

// Quality configuration - qualities as properties with arrays of MODEL_IDs
export const qualityConfig = {
  low: [FLUX_SCHNELL_MODEL_ID],
  medium: [FLUX_DEV_MODEL_ID],
  high: [FLUX_1_PRO_MODEL_ID, SEEDREAM_3_MODEL_ID],
} as const;

export type ModelQuality = keyof typeof qualityConfig;
