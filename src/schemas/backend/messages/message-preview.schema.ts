import z from "zod";

import { messageIdSchema } from "./message.schema";

// Strict backend-only preview schema for branch messages (with strong ID validation)
export const messagePreviewSchema = z.object({
  id: messageIdSchema,
  role: z.string(),
  preview: z.string(),
  createdAt: z.date(),
});

export type BranchPreview = z.infer<typeof messagePreviewSchema>;
