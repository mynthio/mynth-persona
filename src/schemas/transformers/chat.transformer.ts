import {
  PublicChat,
  PublicChatDetail,
  publicChatDetailSchema,
  publicChatSchema,
} from "@/schemas/shared";

/**
 * Transform internal Chat data to public format (list item)
 * Removes sensitive fields and validates the output
 */
export function transformToPublicChat(chat: any): PublicChat {
  // Validate against list schema
  return publicChatSchema.parse({
    id: chat.id,
    title: chat.title,
    mode: chat.mode,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  });
}

/**
 * Transform internal Chat data to detailed public format (single item)
 */
export function transformToPublicChatDetail(chat: any): PublicChatDetail {
  return publicChatDetailSchema.parse({
    id: chat.id,
    title: chat.title,
    mode: chat.mode,
    settings: chat.settings ?? null,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  });
}

/**
 * Transform array of internal Chat data to public format (list)
 */
export function transformToPublicChats(chats: any[]): PublicChat[] {
  return chats.map(transformToPublicChat);
}
