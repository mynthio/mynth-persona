"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { messages } from "@/db/schema";
import { ttsRateLimitGuard, ttsRateLimitRestore } from "@/lib/rate-limit-tts";
import { resolveVoiceIds } from "@/lib/tts/resolve-voice-ids";
import { extractDialogueParts } from "@/lib/tts/extract-dialogue-parts";
import { generateDialogueAudio } from "@/lib/tts/generate-dialogue-audio";
import { uploadToBunny } from "@/lib/upload";
import { extractPersonaMessageText } from "@/lib/utils";
import { ActionResult } from "@/types/action-result.type";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { logger } from "@/lib/logger";
import { trackAudioGenerated, flushAnalytics } from "@/lib/analytics";

type GenerateMessageAudioResult = {
  audioId: string;
};

export const generateMessageAudio = async (
  messageId: string,
  chatId: string,
): Promise<ActionResult<GenerateMessageAudioResult>> => {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to generate audio",
      },
    };
  }

  // Rate limit check
  const allowed = await ttsRateLimitGuard(userId);
  if (!allowed) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "TTS rate limit exceeded. Please try again later.",
      },
    };
  }

  let shouldRestore = true;

  try {
    // Resolve voice IDs (also validates chat ownership)
    const voiceResult = await resolveVoiceIds(chatId, userId);
    if (!voiceResult.success) {
      return {
        success: false,
        error: {
          code:
            voiceResult.error === "CHAT_NOT_FOUND"
              ? "CHAT_NOT_FOUND"
              : "VOICE_CONFIG_MISSING",
          message:
            voiceResult.error === "CHAT_NOT_FOUND"
              ? "Chat not found"
              : "Voice configuration is missing",
        },
      };
    }

    const { data: voices, chat } = voiceResult;

    logger.debug({ voices });

    // Fetch message and verify it belongs to the chat
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message || message.chatId !== chatId) {
      return {
        success: false,
        error: {
          code: "MESSAGE_NOT_FOUND",
          message: "Message not found",
        },
      };
    }

    if (message.role !== "assistant") {
      return {
        success: false,
        error: {
          code: "MESSAGE_NOT_FOUND",
          message: "Only assistant messages can have audio generated",
        },
      };
    }

    // Extract text from message parts
    const messageText = extractPersonaMessageText(message as PersonaUIMessage);
    if (!messageText || messageText.length === 0) {
      return {
        success: false,
        error: {
          code: "MESSAGE_TOO_LONG",
          message: "Message has no text content",
        },
      };
    }

    if (messageText.length > 1000) {
      return {
        success: false,
        error: {
          code: "MESSAGE_TOO_LONG",
          message: "Message text exceeds 1000 characters",
        },
      };
    }

    // Get character name from persona data
    const personaVersion = chat?.chatPersonas?.[0]?.personaVersion;
    const personaData = personaVersion?.data as { name?: string } | null;
    const characterName =
      personaData?.name ||
      chat?.chatPersonas?.[0]?.persona?.title ||
      "Character";

    // Detect regeneration (message already has audio)
    const existingMetadata = message.metadata as Record<string, unknown> | null;
    const isRegeneration = !!existingMetadata?.audioId;

    // Extract dialogue parts via LLM
    const parts = await extractDialogueParts(messageText, characterName);

    logger.debug({ parts });

    if (!parts || parts.length === 0) {
      return {
        success: false,
        error: {
          code: "GENERATION_FAILED",
          message: "Failed to extract dialogue parts from message",
        },
      };
    }

    // Generate audio via ElevenLabs
    const audioStartTime = Date.now();
    const audioBuffer = await generateDialogueAudio(parts, voices);
    const audioGenerationTimeMs = Date.now() - audioStartTime;

    // Generate audio ID and upload to Bunny CDN
    const audioId = `aud_${nanoid(32)}`;
    await uploadToBunny(`audio/${audioId}.mp3`, audioBuffer);

    // Update message metadata atomically with audioId
    await db
      .update(messages)
      .set({
        metadata: sql`jsonb_set(
          COALESCE(${messages.metadata}, '{}'::jsonb),
          '{audioId}',
          ${JSON.stringify(audioId)}::jsonb
        )`,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));

    shouldRestore = false;

    trackAudioGenerated({
      userId,
      chatId,
      voiceId: voices.characterVoiceId,
      isRegeneration,
      generationTimeMs: audioGenerationTimeMs,
    });
    await flushAnalytics();

    return {
      success: true,
      data: { audioId },
    };
  } catch (error) {
    logger.error(
      { error, messageId, chatId },
      "Failed to generate message audio",
    );

    return {
      success: false,
      error: {
        code: "GENERATION_FAILED",
        message: "Failed to generate audio. Please try again.",
      },
    };
  } finally {
    // Restore rate limit point on failure (best-effort)
    if (shouldRestore) {
      await ttsRateLimitRestore(userId);
    }
  }
};
