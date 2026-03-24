import "server-only";

import { PostHog } from "posthog-node";
import crypto from "crypto";

const isLocalDevelopment =
  process.env.NODE_ENV !== "production" ||
  process.env.TRIGGER_API_URL?.includes("localhost") ||
  process.env.TRIGGER_SECRET_KEY?.startsWith("tr_dev_");

const shouldEnableAnalytics =
  !isLocalDevelopment && Boolean(process.env.POSTHOG_API_KEY);

const posthog = shouldEnableAnalytics
  ? new PostHog(process.env.POSTHOG_API_KEY!, {
      host: process.env.POSTHOG_HOST,
    })
  : null;

function hashSensitive(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

type BaseProperties = {
  $process_person_profile: false;
};

function capture(
  userId: string,
  event: string,
  properties: Record<string, unknown>,
) {
  if (!posthog) return;

  posthog.capture({
    distinctId: hashSensitive(userId),
    event,
    properties: {
      ...properties,
      $process_person_profile: false,
    } as BaseProperties & Record<string, unknown>,
  });
}

// Chat messaging events

export function trackMessageSent({
  userId,
  modelId,
  inputTokens,
  outputTokens,
  chatId,
}: {
  userId: string;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  chatId: string;
}) {
  capture(userId, "message_sent", {
    model_id: modelId,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    chat_id: hashSensitive(chatId),
  });
}

export function trackMessageRegenerated({
  userId,
  modelId,
  inputTokens,
  outputTokens,
  chatId,
}: {
  userId: string;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  chatId: string;
}) {
  capture(userId, "message_regenerated", {
    model_id: modelId,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    chat_id: hashSensitive(chatId),
  });
}

export function trackMessageContinued({
  userId,
  modelId,
  inputTokens,
  outputTokens,
  chatId,
}: {
  userId: string;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  chatId: string;
}) {
  capture(userId, "message_continued", {
    model_id: modelId,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    chat_id: hashSensitive(chatId),
  });
}

export function trackMessageEdited({
  userId,
  chatId,
  mode,
}: {
  userId: string;
  chatId: string;
  mode: "update" | "save_as_new";
}) {
  capture(userId, "message_edited", {
    role: "assistant",
    mode,
    chat_id: hashSensitive(chatId),
  });
}

// Image generation events

type ImageContext = "persona" | "message" | "scene";

export function trackImageGenerationSubmitted({
  userId,
  modelId,
  context,
  personaId,
  chatId,
  cost,
}: {
  userId: string;
  modelId: string;
  context: ImageContext;
  personaId?: string;
  chatId?: string;
  cost: number;
}) {
  capture(userId, "image_generation_submitted", {
    model_id: modelId,
    context,
    persona_id: personaId ? hashSensitive(personaId) : undefined,
    chat_id: chatId ? hashSensitive(chatId) : undefined,
    cost,
  });
}

export function trackImageGenerationCompleted({
  userId,
  modelId,
  context,
  personaId,
  chatId,
  cost,
  generationTimeMs,
  imageCount,
}: {
  userId: string;
  modelId: string;
  context: ImageContext;
  personaId?: string;
  chatId?: string;
  cost: number;
  generationTimeMs: number;
  imageCount: number;
}) {
  capture(userId, "image_generation_completed", {
    model_id: modelId,
    context,
    persona_id: personaId ? hashSensitive(personaId) : undefined,
    chat_id: chatId ? hashSensitive(chatId) : undefined,
    cost,
    generation_time_ms: generationTimeMs,
    image_count: imageCount,
  });
}

export function trackImageGenerationFailed({
  userId,
  modelId,
  context,
  personaId,
  chatId,
  cost,
}: {
  userId: string;
  modelId: string;
  context: ImageContext;
  personaId?: string;
  chatId?: string;
  cost: number;
}) {
  capture(userId, "image_generation_failed", {
    model_id: modelId,
    context,
    persona_id: personaId ? hashSensitive(personaId) : undefined,
    chat_id: chatId ? hashSensitive(chatId) : undefined,
    cost,
  });
}

// Audio generation events

export function trackAudioGenerated({
  userId,
  chatId,
  voiceId,
  isRegeneration,
  generationTimeMs,
}: {
  userId: string;
  chatId: string;
  voiceId?: string;
  isRegeneration: boolean;
  generationTimeMs: number;
}) {
  capture(userId, "audio_generated", {
    chat_id: hashSensitive(chatId),
    voice_id: voiceId,
    is_regeneration: isRegeneration,
    generation_time_ms: generationTimeMs,
  });
}

export async function flushAnalytics() {
  if (!posthog) return;

  await posthog.flush();
}

export async function shutdownAnalytics() {
  if (!posthog) return;

  await posthog.shutdown();
}
