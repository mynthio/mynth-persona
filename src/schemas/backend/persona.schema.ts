import { z } from "zod/v4";
import { createSelectSchema } from "drizzle-zod";
import { personas, personaVersions } from "@/db/schema";

/**
 * Full persona data schema - includes all fields including sensitive ones
 * This is the complete schema used internally by the backend
 */
export const personaDataSchema = z.object({
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
 * Base persona schema from database
 */
export const basePersonaSchema = createSelectSchema(personas);

/**
 * Base persona version schema from database
 */
export const basePersonaVersionSchema = createSelectSchema(personaVersions);

/**
 * Complete persona version with typed data
 */
export type PersonaVersion = Omit<
  z.output<typeof basePersonaVersionSchema>,
  "data"
> & {
  data: PersonaData;
};

/**
 * Complete persona from database
 */
export type Persona = z.output<typeof basePersonaSchema>;

/**
 * Persona with a specific version
 */
export type PersonaWithVersion = Persona & {
  version: PersonaVersion;
};

/**
 * Persona with current version (nullable)
 */
export type PersonaWithCurrentVersion = Persona & {
  currentVersion?: PersonaVersion;
};

// Type exports
export type PersonaData = z.infer<typeof personaDataSchema>;
