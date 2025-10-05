import { messages } from "@/db/schema";

import { createSelectSchema } from "drizzle-zod";
import z from "zod/v4";
import { languageModelUsageSchema } from "../ai/language-model-usage.schema";

export const messageMetadataSchema = z.object({
  model: z.string(),
  providr: z.string(),
  cost: z.number(),
  usage: languageModelUsageSchema,
});

// Message ID schema (shared across backend message schemas)
export const messageIdSchema = z.string().startsWith("msg_").length(36);
export type MessageId = `msg_${string}`;

export const messageSchema = createSelectSchema(messages, {
  id: () => messageIdSchema,
});

// Narrow message shape used in chat thread responses
export const messageListItemSchema = messageSchema.pick({
  id: true,
  parentId: true,
  chatId: true,
  role: true,
  parts: true,
  createdAt: true,
  updatedAt: true,
});
export type MessageListItem = z.infer<typeof messageListItemSchema>;

export const messageThreadResponseSchema = z.object({
  leafId: messageIdSchema.nullable(),
  messages: z.array(messageListItemSchema),
});
export type MessageThreadResponse = z.infer<typeof messageThreadResponseSchema>;
