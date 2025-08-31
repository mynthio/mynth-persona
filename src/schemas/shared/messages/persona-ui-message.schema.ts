import { UIMessage } from "ai";
import z from "zod/v4";

export const personaUIMessageMetadataSchema = z.object({
  parentId: z.string().optional().nullable(),
  regenerate: z.boolean().optional(),
  regeneratedForId: z.string().optional().nullable(),
  // Optional fields populated by the API when generating images/streaming
  publicToken: z.string().optional(),
  runId: z.string().optional(),
});

export type PersonaUIMessageMetadata = z.infer<
  typeof personaUIMessageMetadataSchema
>;

export type PersonaUIMessage = UIMessage<PersonaUIMessageMetadata>;
