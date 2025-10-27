import { messageIdSchema } from "@/schemas/backend/messages/message.schema";
import z from "zod/v4";

// Client schema for regenerate message payload
export const regenerateMessagePayloadSchema = z.object({
  event: z.literal("regenerate"),

  parentId: z.string().nullable(),

  message: z.object({
    id: messageIdSchema,
    role: z.literal("user"),
    parts: z.array(
      z.object({
        type: z.literal("text"),
        text: z.string(),
      })
    ),
    metadata: z
      .object({
        parentId: z.string().nullable(),
      })
      .optional(),
  }).optional(),
});

export type RegenerateMessagePayload = z.infer<
  typeof regenerateMessagePayloadSchema
>;
