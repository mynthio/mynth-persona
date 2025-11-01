import { messages } from "@/db/schema";

import { createSelectSchema } from "drizzle-zod";
import z from "zod";
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
