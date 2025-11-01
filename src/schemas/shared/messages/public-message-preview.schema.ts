import z from "zod";

// Lightweight, UI-safe preview of a message within a branch (relaxed ID validation)
export const publicMessagePreviewSchema = z.object({
  id: z.string(),
  role: z.string(),
  preview: z.string(),
  createdAt: z.date(),
});

export type PublicMessagePreview = z.infer<typeof publicMessagePreviewSchema>;
