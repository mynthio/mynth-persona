import { db } from "@/db/drizzle";
import { personaVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { RoleplaySummary } from "./roleplay-summary.service";
import type { PersonaData } from "@/types/persona.type";
import type { PersonaVersionRoleplayData } from "@/schemas/backend/personas/persona-version.schema";

export type UpdatePersonaVersionRoleplayDataArgs = {
  personaVersionId: string;
  summary: RoleplaySummary;
  personaData: PersonaData;
};

/**
 * Update a persona version's roleplayData using a generated summary and the base persona data.
 * Does not generate the summary itself; expects summary to be provided.
 */
export async function updatePersonaVersionRoleplayData(
  args: UpdatePersonaVersionRoleplayDataArgs
): Promise<PersonaVersionRoleplayData> {
  const { personaVersionId, summary, personaData } = args;

  const {
    appearance,
    personality,
    background,
    interests,
    skills,
    motivations,
  } = summary;

  const roleplayData: PersonaVersionRoleplayData = {
    name: personaData.name,
    age: personaData.age,
    gender: personaData.gender,
    appearance,
    personality,
    background,
    interests,
    skills,
    motivations,
  };

  await db
    .update(personaVersions)
    .set({ roleplayData })
    .where(eq(personaVersions.id, personaVersionId));

  return roleplayData;
}