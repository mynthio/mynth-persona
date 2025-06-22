import "server-only";

import { personas, personaVersions } from "@/db/schema";
import { createSelectSchema } from "drizzle-arktype";
import { PersonaVersion } from "./persona-version.type";

export const Persona = createSelectSchema(personas);

export type Persona = typeof Persona.infer;

export type PersonaWithCurrentVersion = typeof Persona.infer & {
  currentVersion: PersonaVersion;
  profileImage?: {
    id: string;
    url: string;
    altText: string | null;
  } | null;
};

export type PersonaWithVersion = typeof Persona.infer & {
  version: PersonaVersion;
};
