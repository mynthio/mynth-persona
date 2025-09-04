import { z } from "zod";

/**
 * Public persona data schema - contains only fields that are safe to expose via API
 * This excludes sensitive information and internal metadata
 */
export const publicPersonaDataSchema = z.object({
  name: z.string().describe("Full name or alias"),
  age: z.string().describe("Specific, descriptive, or unknown"),
  gender: z.string().describe("Gender/pronouns"),
  appearance: z
    .string()
    .describe("Physical description (build, features, clothing, marks)"),
  personality: z
    .string()
    .describe(
      "Traits, temperament, interactions, emotions (required for depth)"
    ),
  background: z
    .string()
    .describe(
      "History, upbringing, key events (required for meaningful story)"
    ),
  summary: z
    .string()
    .describe("1-2 sentences capturing essence, vibe, and scene ideas"),
  occupation: z
    .string()
    .optional()
    .describe("Role/work (optional, as not all characters need it)"),
  extensions: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      "Optional key-value object; AI adds only if relevant (e.g., {'skills': 'Stealth, Lockpicking', 'universe': 'Cyberpunk dystopia'})"
    ),
});

/**
 * Public persona schema - basic persona information without sensitive data
 * This is the main public persona type without version data
 */
export const publicPersonaSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  profileImageId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const publicPersonaVersionMetadataSchema = z.object({
  aiNote: z.string().optional().nullable(),
  userMessage: z.string().optional().nullable(),
});

/**
 * Public persona version schema - version information without sensitive metadata
 */
export const publicPersonaVersionSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  title: z.string().nullable(),
  versionNumber: z.number(),
  data: publicPersonaDataSchema,
  createdAt: z.date(),
  metadata: publicPersonaVersionMetadataSchema
    .optional()
    .nullable()
    .default({}),
});

// Type exports
export type PublicPersonaData = z.infer<typeof publicPersonaDataSchema>;
export type PublicPersona = z.infer<typeof publicPersonaSchema>;
export type PublicPersonaVersion = z.infer<typeof publicPersonaVersionSchema>;
