import "server-only";

import { getChatWithPersonaVoiceCached } from "@/data/chats/get-chat.data";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";
import {
  DEFAULT_CHARACTER_VOICE_IDS,
  DEFAULT_NARRATIVE_VOICE_ID,
} from "@/lib/constants";

export type ResolvedVoices = {
  characterVoiceId: string;
  narrativeVoiceId: string;
};

/**
 * Resolves character and narrative voice IDs using the resolution chain:
 *
 * Character voice: chat characterVoiceId → persona voiceId → DEFAULT_CHARACTER_VOICE_IDS[gender]
 * Narrative voice: chat narrativeVoiceId → DEFAULT_NARRATIVE_VOICE_ID
 */
export async function resolveVoiceIds(
  chatId: string,
  userId: string
): Promise<
  | { success: true; data: ResolvedVoices; chat: Awaited<ReturnType<typeof getChatWithPersonaVoiceCached>> }
  | { success: false; error: string }
> {
  const chat = await getChatWithPersonaVoiceCached(chatId, userId);

  if (!chat) {
    return { success: false, error: "CHAT_NOT_FOUND" };
  }

  const chatSettings = chat.settings as ChatSettings | null;
  const persona = chat.chatPersonas?.[0]?.persona;

  // Resolve character voice: chat settings → persona → default by gender
  const characterVoiceId =
    chatSettings?.characterVoiceId ||
    persona?.voiceId ||
    DEFAULT_CHARACTER_VOICE_IDS[persona?.gender || "other"] ||
    DEFAULT_CHARACTER_VOICE_IDS["other"];

  // Resolve narrative voice: chat settings → default
  const narrativeVoiceId =
    chatSettings?.narrativeVoiceId || DEFAULT_NARRATIVE_VOICE_ID;

  if (!characterVoiceId || !narrativeVoiceId) {
    return { success: false, error: "VOICE_CONFIG_MISSING" };
  }

  return {
    success: true,
    data: { characterVoiceId, narrativeVoiceId },
    chat,
  };
}
