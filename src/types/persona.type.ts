import { personas, personaVersions } from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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

export type PersonaData = z.infer<typeof personaDataSchema>;

export const basePersonaVersionSchema = createSelectSchema(personaVersions) as unknown as z.ZodType<any>;

// Fix the type intersection issue by excluding 'data' from base schema and adding it back with proper type
export type PersonaVersion = Omit<
  z.output<typeof basePersonaVersionSchema>,
  "data"
> & {
  data: PersonaData;
};

export const basePersonaSchema = createSelectSchema(personas) as unknown as z.ZodType<any>;

export type Persona = z.output<typeof basePersonaSchema>;

export type PersonaWithVersion = Persona & {
  version: PersonaVersion;
};

export type PersonaWithCurrentVersion = Persona & {
  currentVersion?: PersonaVersion;
};
