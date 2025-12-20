import "server-only";

import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import { DEFAULT_CHAT_MODEL } from "@/config/shared/chat/chat-models.config";
import {
  CHAT_RATE_LIMITS,
  rateLimitGuard,
  EcoChatRateLimit,
} from "@/lib/rate-limit";
import { PlanId } from "@/config/shared/plans";

export interface ChatModelSelectionResult {
  resolvedModelId: string;
  textGenerationModel: (typeof textGenerationModels)[string];
  modelTier: string;
}

/**
 * Selects and validates the text generation model for a chat request
 * @param payloadModelId - Model ID from the request payload
 * @param chatSettingsModel - Model ID from chat settings
 * @returns Object containing resolved model info
 */
export function selectTextGenerationModel(
  payloadModelId: string | undefined,
  chatSettingsModel: string | null | undefined
): ChatModelSelectionResult {
  // Priority: payload.modelId → chatSettings.model → DEFAULT_CHAT_MODEL
  // Falls back if payload model is invalid
  const resolvedModelId =
    (payloadModelId && textGenerationModels[payloadModelId]
      ? payloadModelId
      : null) ??
    chatSettingsModel ??
    DEFAULT_CHAT_MODEL;

  const textGenerationModel = textGenerationModels[resolvedModelId];
  if (!textGenerationModel) {
    throw new Error("Model not supported");
  }

  const modelTier = textGenerationModel.tier;

  return {
    resolvedModelId,
    textGenerationModel,
    modelTier,
  };
}

/**
 * Checks if a free user is trying to use a premium model and blocks access
 * @param modelTier - The tier of the selected model
 * @param planId - The user's plan ID
 * @returns Response with error if access should be blocked, null otherwise
 */
export function checkPremiumModelAccess(
  modelTier: string,
  planId: PlanId
): Response | null {
  // Block free users from premium models
  if (modelTier === "premium" && planId === "free") {
    return new Response(
      JSON.stringify({
        error: "premium_model_not_available" as const,
      }),
      {
        status: 403,
      }
    );
  }

  return null;
}

/**
 * Selects the appropriate rate limiter based on model tier and user plan
 * @param modelTier - The tier of the selected model
 * @param planId - The user's plan ID
 * @returns The appropriate rate limiter
 */
export function selectRateLimiter(modelTier: string, planId: PlanId) {
  let rateLimiter;
  if (modelTier === "eco") {
    // Eco tier uses global rate limiter
    rateLimiter = EcoChatRateLimit;
  } else if (modelTier === "premium") {
    rateLimiter = CHAT_RATE_LIMITS[planId]["premium"];
  } else {
    // standard, free, cheap tiers use standard rate limiter
    rateLimiter = CHAT_RATE_LIMITS[planId]["standard"];
  }

  if (!rateLimiter) {
    throw new Error("Something went wrong.");
  }

  return rateLimiter;
}

/**
 * Checks chat rate limits for a user
 * @param modelTier - The tier of the selected model
 * @param planId - The user's plan ID
 * @param userId - The user's ID for rate limiting
 * @returns Rate limit result or rate limited response
 */
export async function checkChatRateLimit(
  modelTier: string,
  planId: PlanId,
  userId: string
) {
  const rateLimiter = selectRateLimiter(modelTier, planId);
  const rateLimitResult = await rateLimitGuard(rateLimiter, userId);

  if (!rateLimitResult.success) {
    return rateLimitResult.rateLimittedResponse;
  }

  return null;
}
