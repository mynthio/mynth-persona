import { personas, personaVersions } from "@/db/schema";
import { createSelectSchema } from "drizzle-arktype";
import { type } from "arktype";

export const PersonaData = type({
  age: "string",
  appearance: "string",
  background: "string",
  gender: "string",
  name: "string",
  occupation: "string",
  personality: "string",
  universe: "string",
  other: "string?",
});

export type PersonaData = typeof PersonaData.infer;

export const PersonaVersion = createSelectSchema(personaVersions, {
  data: PersonaData,
});

export type Persona = typeof personas.$inferSelect;

export type PersonaVersion = typeof PersonaVersion.infer;

export type PersonaWithVersion = typeof personas.$inferSelect & {
  version: typeof personaVersions.$inferSelect & {
    data: PersonaData;
  };
};

export type PersonaWithCurrentVersion = Persona & {
  currentVersion: PersonaVersion;
};
