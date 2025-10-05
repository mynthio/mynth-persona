import { z } from "zod/v4";
import { chatSchema } from "./chat.schema";

/**
 * Update CHat Payload
 */
export const updateChatPayloadSchema = chatSchema
  .pick({
    title: true,
    settings: true,
    mode: true,
  })
  .partial();

export type UpdateChatPayload = z.infer<typeof updateChatPayloadSchema>;
