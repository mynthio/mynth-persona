import { Persona } from "@/schemas/backend";
import {
  PublicPersona,
  PublicPersonaVersion,
  publicPersonaSchema,
  publicPersonaVersionSchema,
} from "@/schemas/shared";
import {
  PublicPersonaListItem,
  publicPersonaListItemSchema,
} from "@/schemas/shared/persona-public.schema";

/**
 * Transform internal Persona data to public format
 * Removes sensitive fields and validates the output
 */
export function transformToPublicPersona(persona: Persona): PublicPersona {
  // Validate against schema to ensure type safety
  return publicPersonaSchema.parse({
    id: persona.id,
    title: persona.title,
    profileImageIdMedia: persona.profileImageIdMedia,
    createdAt: persona.createdAt,
    updatedAt: persona.updatedAt,
  });
}

/**
 * Transform internal PersonaVersion data to public format
 * Removes sensitive fields and validates the output
 */
export function transformToPublicPersonaVersion(
  personaVersion: any
): PublicPersonaVersion {
  // Validate against schema to ensure type safety and proper data structure
  return publicPersonaVersionSchema.parse({
    id: personaVersion.id,
    personaId: personaVersion.personaId,
    title: personaVersion.title,
    versionNumber: personaVersion.versionNumber,
    data: personaVersion.data, // Will be validated by the schema
    createdAt: personaVersion.createdAt,
    metadata: personaVersion.metadata,
  });
}

/**
 * Transform internal Persona to PublicPersonaListItem for public browse lists
 */
export function transformToPublicPersonaListItem(persona: any): PublicPersonaListItem {
  return publicPersonaListItemSchema.parse({
    id: persona.id,
    slug: persona.slug ?? null,
    title: persona.title ?? null,
    publicName: persona.publicName ?? null,
    headline: persona.headline ?? null,
    profileImageIdMedia: persona.profileImageIdMedia ?? null,
    nsfwRating: persona.nsfwRating,
    gender: persona.gender,
    ageBucket: persona.ageBucket,
    likesCount: persona.likesCount ?? 0,
    publishedAt: persona.publishedAt ?? null,
    publicVersion: persona.publicVersion
      ? transformToPublicPersonaVersion(persona.publicVersion)
      : undefined,
  });
}
