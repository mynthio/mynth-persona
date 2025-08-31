import { z } from "zod/v4";
import { createSelectSchema } from "drizzle-zod";
import { personas, personaVersions } from "@/db/schema";
import { chatSchema } from "./chat.schema";

/**
 * Update CHat Payload
 */
export const updateChatPayloadSchema = chatSchema.pick({
  title: true,
  settings: true,
});

export type UpdateChatPayload = z.infer<typeof updateChatPayloadSchema>;
