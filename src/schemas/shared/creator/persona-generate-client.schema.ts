import z from "zod";
import { creatorPersonaGenerateSchema } from "./persona-generate.schema";

// Client schema for persona generation response
export const creatorPersonaGenerateClientSchema = z.object({
  persona: creatorPersonaGenerateSchema,
  personaId: z.string().optional(),
  versionId: z.string().optional(),
  thinking: z.string().optional(), // Phase 1 creative text (not saved to DB)
  isThinking: z.boolean().optional(), // false when thinking phase is complete
});

export type CreatorPersonaGenerateClientResponse = z.infer<
  typeof creatorPersonaGenerateClientSchema
>;
