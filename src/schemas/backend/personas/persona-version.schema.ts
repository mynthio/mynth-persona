import { z } from "zod";

/**
 * Chat Settings User Persona
 */
export const personaVersionRoleplayData = z.object({
  name: z.string(),
  age: z.string(),
  gender: z.string(), // TODO: Use enum
  appearance: z.string(),
  personality: z.string().nullable().optional(),
  background: z.string().nullable().optional(),
  interests: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  motivations: z.string().nullable().optional(),
});

export type PersonaVersionRoleplayData = z.infer<
  typeof personaVersionRoleplayData
>;
