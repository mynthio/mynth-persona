import {
  PublicPersonaEventWithVersion,
  publicPersonaEventWithVersionSchema,
} from "@/schemas/shared/persona-event.schema";
import { GetPersonaEventsByIdData } from "@/services/persona-events/get-persona-events-by-id";

/**
 * Transform internal PersonaEvent data to public format
 * Removes sensitive fields (like userId) and validates the output
 */
export function transformToPublicPersonaEvent(
  personaEvent: GetPersonaEventsByIdData[number]
): PublicPersonaEventWithVersion {
  return publicPersonaEventWithVersionSchema.parse({
    id: personaEvent.id,
    personaId: personaEvent.personaId,
    type: personaEvent.type,
    versionId: personaEvent.versionId,
    userMessage: personaEvent.userMessage,
    errorMessage: personaEvent.errorMessage,
    aiNote: personaEvent.aiNote,
    tokensCost: personaEvent.tokensCost,
    createdAt: personaEvent.createdAt,
    version: personaEvent.version
      ? {
          id: personaEvent.version.id,
          versionNumber: personaEvent.version.versionNumber,
          title: personaEvent.version.title,
        }
      : undefined,
  });
}

/**
 * Transform array of internal PersonaEvent data to public format
 */
export function transformToPublicPersonaEvents(
  personaEvents: GetPersonaEventsByIdData
): PublicPersonaEventWithVersion[] {
  return personaEvents.map(transformToPublicPersonaEvent);
}
