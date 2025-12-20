import { messageIdSchema } from "@/schemas/backend/messages/message.schema";
import z from "zod";

// Client schema for send message payload
export const sendMessagePayloadSchema = z.object({
  event: z.literal("send"),

  message: z.object({
    id: messageIdSchema,
    role: z.enum(["user", "system"]),
    parts: z.array(
      z.object({
        type: z.literal("text"),
        text: z.string(),
      })
    ),
  }),
  parentId: z.string().or(z.null()),

  // Optional model override - if provided, uses this model for generation
  // and persists it to chat settings on completion
  modelId: z.string().optional(),
});

export type SendMessagePayload = z.infer<typeof sendMessagePayloadSchema>;
