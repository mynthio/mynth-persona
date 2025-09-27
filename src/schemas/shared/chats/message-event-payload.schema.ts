import z from "zod/v4";

import { sendMessagePayloadSchema } from "./send-message-payload.schema";
import { editMessagePayloadSchema } from "./edit-message-payload.schema";
import { regenerateMessagePayloadSchema } from "./regenerate-message-payload.schema";

// Discriminated union for message-related events
export const messageEventPayloadSchema = z.discriminatedUnion("event", [
  sendMessagePayloadSchema,
  editMessagePayloadSchema,
  regenerateMessagePayloadSchema,
]);

export type MessageEventPayload = z.infer<typeof messageEventPayloadSchema>;
