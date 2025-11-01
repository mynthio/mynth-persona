import z from "zod";
import { creatorPersonaGenerateSchema } from "./persona-generate.schema";

// Client schema for persona generation response
export const creatorPersonaGenerateClientSchema = z.object({
  persona: creatorPersonaGenerateSchema,
  personaId: z.string().optional(),
  versionId: z.string().optional(),
});

export type CreatorPersonaGenerateClientResponse = z.infer<
  typeof creatorPersonaGenerateClientSchema
>;
