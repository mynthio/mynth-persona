import { messageIdSchema } from "@/schemas/backend/messages/message.schema";
import z from "zod";

// Client schema for edit message payload
export const editMessagePayloadSchema = z.object({
  event: z.literal("edit_message"),

  parentId: z.string().or(z.null()),

  // newMessageText: z.string(),

  message: z.object({
    id: messageIdSchema,
    role: z.enum(["user", "system"]),
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
  }),

  // Optional model override - if provided, uses this model for generation
  // and persists it to chat settings on completion
  modelId: z.string().optional(),
});

export type EditMessagePayload = z.infer<typeof editMessagePayloadSchema>;
