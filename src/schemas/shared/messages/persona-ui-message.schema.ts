import { UIMessage } from "ai";
import z from "zod/v4";

export const personaUIMessageMetadataSchema = z.object({
  parentId: z.string().optional().nullable(),

  messageId: z.string().optional(),

  usage: z.object({
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional(),
    totalTokens: z.number().optional(),
  }),

  cost: z.number(),
});

export type PersonaUIMessageMetadata = z.infer<
  typeof personaUIMessageMetadataSchema
>;

export type PersonaUIMessage = UIMessage<PersonaUIMessageMetadata>;
