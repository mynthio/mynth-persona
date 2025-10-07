// Central export of all image model ID constants

// Internal IDs (provider-specific)
export { RUNWARE_FLUX_SCHNELL_ID } from "./runware/runware-flux-schnell";
export { RUNWARE_FLUX_DEV_ID } from "./runware/runware-flux-dev";
export { RUNWARE_FLUX_1_PRO_ID } from "./runware/runware-flux-1-pro";
export { RUNWARE_FLUX_1_1_PRO_ULTRA_ID } from "./runware/runware-flux-1.1-pro-ultra";
export { RUNWARE_SEEDREAM_3_ID } from "./runware/runware-seedream-3";
export { RUNWARE_BISMUTH_ILLUSTRIOUS_MIX_V4_0_ID } from "./runware/runware-bismuth-illustrious-mix-v-4-0";

// Universal Model IDs (provider-agnostic)
export { FLUX_SCHNELL_MODEL_ID } from "./runware/runware-flux-schnell"; // Use one source to avoid duplicates
export { FLUX_DEV_MODEL_ID } from "./runware/runware-flux-dev";
export { FLUX_1_PRO_MODEL_ID } from "./runware/runware-flux-1-pro";
export { FLUX_1_1_PRO_ULTRA_MODEL_ID } from "./runware/runware-flux-1.1-pro-ultra";
export { SEEDREAM_3_MODEL_ID } from "./runware/runware-seedream-3";
export { BISMUTH_ILLUSTRIOUS_MIX_V4_0_MODEL_ID } from "./runware/runware-bismuth-illustrious-mix-v-4-0";

// Import the constants for the union type
import type { FLUX_SCHNELL_MODEL_ID } from "./runware/runware-flux-schnell";
import type { FLUX_DEV_MODEL_ID } from "./runware/runware-flux-dev";
import type { FLUX_1_PRO_MODEL_ID } from "./runware/runware-flux-1-pro";
import type { FLUX_1_1_PRO_ULTRA_MODEL_ID } from "./runware/runware-flux-1.1-pro-ultra";
import type { SEEDREAM_3_MODEL_ID } from "./runware/runware-seedream-3";
import type { BISMUTH_ILLUSTRIOUS_MIX_V4_0_MODEL_ID } from "./runware/runware-bismuth-illustrious-mix-v-4-0";

// Union type for all universal model IDs
export type UniversalModelId =
  | typeof FLUX_SCHNELL_MODEL_ID
  | typeof FLUX_DEV_MODEL_ID
  | typeof FLUX_1_PRO_MODEL_ID
  | typeof FLUX_1_1_PRO_ULTRA_MODEL_ID
  | typeof SEEDREAM_3_MODEL_ID
  | typeof BISMUTH_ILLUSTRIOUS_MIX_V4_0_MODEL_ID;
