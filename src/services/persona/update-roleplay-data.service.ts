import { db } from "@/db/drizzle";
import { personaVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  RoleplaySummary,
  RoleplaySummaryV2,
} from "./roleplay-summary.service";
import { convertV2SummaryToRoleplayData } from "./roleplay-summary.service";
import type { PersonaData } from "@/types/persona.type";
import type { PersonaVersionRoleplayData } from "@/schemas/backend/personas/persona-version.schema";

export type UpdatePersonaVersionRoleplayDataArgs = {
  personaVersionId: string;
  summary: RoleplaySummary;
  personaData: PersonaData;
};

export type UpdatePersonaVersionRoleplayDataV2Args = {
  personaVersionId: string;
  summaryV2: RoleplaySummaryV2;
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

/**
 * Update a persona version's roleplayData with V2 summary.
 * Populates V1 fields from V2 structured data for backwards compatibility.
 */
export async function updatePersonaVersionRoleplayDataV2(
  args: UpdatePersonaVersionRoleplayDataV2Args
): Promise<PersonaVersionRoleplayData> {
  const { personaVersionId, summaryV2, personaData } = args;

  const v2Data = convertV2SummaryToRoleplayData(summaryV2);

  const roleplayData: PersonaVersionRoleplayData = {
    // V1 legacy fields - populated from V2 structured data for backwards compatibility
    name: personaData.name,
    age: personaData.age,
    gender: personaData.gender,
    appearance: v2Data.structured.appearance,
    personality: v2Data.structured.personality,
    background: v2Data.structured.background,
    // V1-only fields (not in V2) - set to undefined
    interests: undefined,
    skills: undefined,
    motivations: undefined,
    // V2 data
    v2: v2Data,
  };

  await db
    .update(personaVersions)
    .set({ roleplayData })
    .where(eq(personaVersions.id, personaVersionId));

  return roleplayData;
}
