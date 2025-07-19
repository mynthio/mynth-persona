import { z } from "zod";

// Public schema for persona images used by the gallery endpoint
export const publicPersonaImageSchema = z.object({
  id: z.string(),
});

export type PublicPersonaImage = z.infer<typeof publicPersonaImageSchema>;
