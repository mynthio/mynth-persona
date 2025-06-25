import "server-only";

import { personaEvents, personas, personaVersions } from "@/db/schema";
import { createSelectSchema } from "drizzle-arktype";
import { PersonaVersion } from "./persona-version.type";

export const PersonaEvent = createSelectSchema(personaEvents);

export type PersonaEvent = typeof PersonaEvent.infer;

export type PersonaEventWithVersion = PersonaEvent & {
  version?: {
    versionNumber: number;
    title?: string;
  };
  imageGeneration?: {
    id: string;
    status: string;
    runId: string;
    imageId: string;
  };
};
