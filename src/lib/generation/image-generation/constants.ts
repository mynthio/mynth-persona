// Central export of all image model ID constants

// Internal IDs (provider-specific)
export { RUNWARE_FLUX_SCHNELL_ID } from "./runware/runware-flux-schnell";
export { RUNWARE_FLUX_DEV_ID } from "./runware/runware-flux-dev";
export { RUNWARE_FLUX_1_PRO_ID } from "./runware/runware-flux-1-pro";
export { RUNWARE_FLUX_1_1_PRO_ULTRA_ID } from "./runware/runware-flux-1.1-pro-ultra";
export { RUNWARE_SEEDREAM_3_ID } from "./runware/runware-seedream-3";

// Universal Model IDs (provider-agnostic)
export { FLUX_SCHNELL_MODEL_ID } from "./runware/runware-flux-schnell"; // Use one source to avoid duplicates
export { FLUX_DEV_MODEL_ID } from "./runware/runware-flux-dev";
export { FLUX_1_PRO_MODEL_ID } from "./runware/runware-flux-1-pro";
export { FLUX_1_1_PRO_ULTRA_MODEL_ID } from "./runware/runware-flux-1.1-pro-ultra";
export { SEEDREAM_3_MODEL_ID } from "./runware/runware-seedream-3";

// Import the constants for the union type
import type { FLUX_SCHNELL_MODEL_ID } from "./runware/runware-flux-schnell";
import type { FLUX_DEV_MODEL_ID } from "./runware/runware-flux-dev";
import type { FLUX_1_PRO_MODEL_ID } from "./runware/runware-flux-1-pro";
import type { FLUX_1_1_PRO_ULTRA_MODEL_ID } from "./runware/runware-flux-1.1-pro-ultra";
import type { SEEDREAM_3_MODEL_ID } from "./runware/runware-seedream-3";

// Union type for all universal model IDs
export type UniversalModelId =
  | typeof FLUX_SCHNELL_MODEL_ID
  | typeof FLUX_DEV_MODEL_ID
  | typeof FLUX_1_PRO_MODEL_ID
  | typeof FLUX_1_1_PRO_ULTRA_MODEL_ID
  | typeof SEEDREAM_3_MODEL_ID;

/**
 * Usage examples for the enhanced universal MODEL_ID system with multi-model fallbacks:
 *
 * ============================================================================
 * SIMPLE UI MODE: Quality + Size Selection (Multi-Model Fallback)
 * ============================================================================
 *
 * // Basic quality-based generation (selects best provider across all models)
 * const model = ImageGenerationFactory.byQuality("low", {
 *   requireFreeUser: true,
 *   randomizeWithinPriority: true  // Load balance between equal priority providers
 * });
 * const result = await model.generate("A beautiful sunset", { width: 512, height: 512 });
 *
 * // Advanced: Quality-based with automatic retry across multiple models/providers
 * const result = await ImageGenerationFactory.byQualityWithRetry(
 *   "low",
 *   "A beautiful sunset",
 *   {
 *     requireFreeUser: true,
 *     maxRetries: 3,  // Try up to 3 different providers
 *     generationOptions: { width: 512, height: 512, userId: "user123" }
 *   }
 * );
 *
 * // Get all available providers for a quality level (for UI display)
 * const providers = ImageGenerationFactory.getAggregatedProvidersForQuality("low", {
 *   onlyEnabled: true,
 *   requireFreeUser: true
 * });
 * console.log(`${providers.length} providers available across multiple models`);
 *
 * ============================================================================
 * ADVANCED UI MODE: Specific Model Selection
 * ============================================================================
 *
 * // Direct model selection (as before)
 * const model = ImageGenerationFactory.byUniversalModelId(FLUX_SCHNELL_MODEL_ID);
 * const result = await model.generate("A beautiful sunset");
 *
 * // Get providers for specific model (for advanced UI display)
 * const providers = ImageGenerationFactory.getProvidersForModel(FLUX_SCHNELL_MODEL_ID, {
 *   onlyEnabled: true
 * });
 *
 * ============================================================================
 * SYSTEM INFORMATION
 * ============================================================================
 *
 * // Get all available models with constraints
 * const availableModels = ImageGenerationFactory.getAllAvailableModels({
 *   onlyEnabled: true,
 *   allowDeprecated: false,
 *   requireFreeUser: true
 * });
 *
 * // Access model metadata from any instance
 * console.log(`Universal Model: ${model.modelId}`); // "black-forest-labs/flux-schnell"
 * console.log(`Provider: ${model.internalId}`);     // "runware/flux-schnell"
 *
 * ============================================================================
 * BENEFITS OF NEW MULTI-MODEL APPROACH:
 * ============================================================================
 *
 * 1. SIMPLE MODE (Quality): Users get best possible success rate
 *    - If FLUX Schnell fails, automatically tries Dreamshaper or Stable Diffusion
 *    - Transparent fallbacks across multiple models in same quality tier
 *    - Load balancing across providers of equal priority
 *
 * 2. ADVANCED MODE (Model): Users get full control
 *    - Direct model selection with provider-level fallbacks
 *    - Clear understanding of what model they're using
 *
 * 3. CONFIGURATION: Zero duplication, maximum flexibility
 *    - Same config supports both modes
 *    - Easy to add new models to quality levels
 *    - Easy to adjust provider priorities
 */
