import { messageIdSchema } from "@/schemas/backend/messages/message.schema";
import z from "zod";

// Client schema for send message payload
export const sendMessagePayloadSchema = z.object({
  event: z.literal("send"),

  message: z.object({
    id: messageIdSchema,
    role: z.literal("user"),
    parts: z.array(
      z.object({
        type: z.literal("text"),
        text: z.string(),
      })
    ),
  }),
  parentId: z.string().or(z.null()),
});

export type SendMessagePayload = z.infer<typeof sendMessagePayloadSchema>;
