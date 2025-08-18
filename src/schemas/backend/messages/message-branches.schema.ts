import z from "zod/v4";
import { messageIdSchema } from "./message.schema";

// Minimal child entry under a parent message's branches
export const messageBranchesChildSchema = z.object({
  id: messageIdSchema,
  createdAt: z.date(),
});

export type MessageBranchesChild = z.infer<typeof messageBranchesChildSchema>;

// Map: parent message ID -> array of child branches
export const messageBranchesByParentSchema = z.record(
  messageIdSchema,
  z.array(messageBranchesChildSchema)
);

export type MessageBranchesByParent = z.infer<
  typeof messageBranchesByParentSchema
>;
