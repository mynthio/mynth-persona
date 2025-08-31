import { z } from "zod/v4";
import { chatSchema } from "../backend/chats/chat.schema";

/**
 * Public chat schema - contains chat information without sensitive data (for lists)
 */
export const publicChatSchema = chatSchema.pick({
  id: true,
  title: true,
  mode: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Detailed chat schema - includes additional fields for single chat fetching
 */
export const publicChatDetailSchema = chatSchema.pick({
  id: true,
  title: true,
  mode: true,
  settings: true,
  createdAt: true,
  updatedAt: true,
});

export type PublicChat = z.infer<typeof publicChatSchema>;
export type PublicChatDetail = z.infer<typeof publicChatDetailSchema>;
