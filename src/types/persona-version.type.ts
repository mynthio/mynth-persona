import { personaVersions } from "@/db/schema";
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
  personaData: PersonaData,
});

export type PersonaVersion = typeof PersonaVersion.infer;
