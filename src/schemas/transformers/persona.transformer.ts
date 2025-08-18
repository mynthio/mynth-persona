import { Persona, PersonaVersion } from "@/schemas/backend";
import { PublicPersona, PublicPersonaVersion, publicPersonaSchema, publicPersonaVersionSchema } from "@/schemas/shared";

/**
 * Transform internal Persona data to public format
 * Removes sensitive fields and validates the output
 */
export function transformToPublicPersona(persona: Persona): PublicPersona {
  // Validate against schema to ensure type safety
  return publicPersonaSchema.parse({
    id: persona.id,
    title: persona.title,
    profileImageId: persona.profileImageId,
    createdAt: persona.createdAt,
    updatedAt: persona.updatedAt,
  });
}

/**
 * Transform internal PersonaVersion data to public format
 * Removes sensitive fields and validates the output
 */
export function transformToPublicPersonaVersion(personaVersion: any): PublicPersonaVersion {
  // Validate against schema to ensure type safety and proper data structure
  return publicPersonaVersionSchema.parse({
    id: personaVersion.id,
    personaId: personaVersion.personaId,
    title: personaVersion.title,
    versionNumber: personaVersion.versionNumber,
    data: personaVersion.data, // Will be validated by the schema
    createdAt: personaVersion.createdAt,
  });
}
