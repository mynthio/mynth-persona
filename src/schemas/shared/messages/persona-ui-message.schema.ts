import { UIMessage } from "ai";
import z from "zod";

export const personaUIMessageMetadataSchema = z.object({
  parentId: z.string().optional().nullable(),

  messageId: z.string().optional(),

  media: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["image", "video"]),
      })
    )
    .optional(),

  usage: z
    .object({
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),

  checkpoint: z
    .object({
      content: z.string().optional().nullable(),
      parentCheckpointMessageId: z.string().optional().nullable(),
      createdAt: z.date(),
    })
    .optional(),
});

export type PersonaUIMessageMetadata = z.infer<
  typeof personaUIMessageMetadataSchema
>;

export type PersonaUIMessage = UIMessage<PersonaUIMessageMetadata>;
