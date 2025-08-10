import { z } from "zod/v4";
import { createSelectSchema } from "drizzle-zod";
import { personaEvents, personaEventTypeEnum } from "@/db/schema";

/**
 * Full persona event schema - includes all fields including sensitive ones
 * This is the complete schema used internally by the backend
 */
export const basePersonaEventSchema = createSelectSchema(personaEvents);

/**
 * Complete persona event from database
 */
export type PersonaEvent = z.output<typeof basePersonaEventSchema>;

/**
 * Persona event with version information
 */
export type PersonaEventWithVersion = PersonaEvent & {
  version?: {
    id: string;
    versionNumber: number;
    title?: string | null;
  };
};

/**
 * Persona event with image generation information
 */
export type PersonaEventWithImageGeneration = PersonaEvent & {
  imageGenerations?: {
    id: string;
    status: string;
    runId: string | null;
    imageId: string | null;
  }[];
};

/**
 * Complete persona event with all related data
 */
export type PersonaEventWithRelations = PersonaEvent & {
  version?: {
    id: string;
    versionNumber: number;
    title?: string | null;
  };
  imageGenerations?: {
    id: string;
    status: string;
    runId: string | null;
    imageId: string | null;
  }[];
};

// Export the enum for type safety
export { personaEventTypeEnum };
export type PersonaEventType = z.infer<typeof personaEventTypeEnum>;