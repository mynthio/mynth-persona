import { z } from "zod";

/**
 * Public persona event type enum - safe to expose via API
 */
export const publicPersonaEventTypeSchema = z.enum([
  "persona_create",
  "persona_edit",
  "persona_revert",
  "persona_clone",
]);

/**
 * Public persona event schema - contains only fields that are safe to expose via API
 * This excludes sensitive information like user IDs and internal metadata
 */
export const publicPersonaEventSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  type: publicPersonaEventTypeSchema,
  versionId: z.string().nullable(),
  userMessage: z.string().nullable(),
  errorMessage: z.string().nullable(),
  aiNote: z.string().nullable(),
  tokensCost: z.number(),
  createdAt: z.date(),
});

/**
 * Public persona event with version information
 */
export const publicPersonaEventWithVersionSchema =
  publicPersonaEventSchema.extend({
    version: z
      .object({
        id: z.string(),
        versionNumber: z.number(),
        title: z.string().nullable(),
      })
      .optional(),
  });

// Type exports
export type PublicPersonaEventType = z.infer<
  typeof publicPersonaEventTypeSchema
>;
export type PublicPersonaEvent = z.infer<typeof publicPersonaEventSchema>;
export type PublicPersonaEventWithVersion = z.infer<
  typeof publicPersonaEventWithVersionSchema
>;
