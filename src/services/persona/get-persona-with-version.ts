import { db } from "@/db/drizzle";
import { personas, personaVersions } from "@/db/schema";
import { Persona, PersonaVersion, PersonaWithVersion } from "@/schemas/backend";
import { and, eq, ne } from "drizzle-orm";

type GetPersonaWithVersionParams = {
  userId: string;
  personaId: string;
  versionId?: string;
};

export const getPersonaWithVersion = async (
  params: GetPersonaWithVersionParams
): Promise<PersonaWithVersion> => {
  const { userId, personaId, versionId } = params;

  return versionId
    ? getPersonaWithSpecificVersion({ userId, personaId, versionId })
    : getPersonaWithCurrentVersion({ userId, personaId });
};

type GetPersonaWithCurrentVersionParams = {
  userId: string;
  personaId: string;
};

export const getPersonaWithCurrentVersion = async (
  params: GetPersonaWithCurrentVersionParams
): Promise<PersonaWithVersion> => {
  const { userId, personaId } = params;

  const maybePersona = await db.query.personas.findFirst({
    where: and(
      eq(personas.id, personaId),
      eq(personas.userId, userId),
      ne(personas.visibility, "deleted")
    ),
    with: {
      currentVersion: true,
    },
  });

  if (!maybePersona) {
    throw new Error("Persona not found");
  }

  if (!maybePersona.currentVersion) {
    throw new Error("Current version not found");
  }

  const { currentVersion, ...persona } = maybePersona;

  return {
    ...persona,
    version: currentVersion as PersonaVersion,
  };
};

type GetPersonaWithSpecificVersionParams = {
  userId: string;
  personaId: string;
  versionId: string;
};

export const getPersonaWithSpecificVersion = async (
  params: GetPersonaWithSpecificVersionParams
): Promise<PersonaWithVersion> => {
  const { userId, personaId, versionId } = params;

  const maybePersona = await db.query.personas.findFirst({
    where: and(
      eq(personas.id, personaId),
      eq(personas.userId, userId),
      ne(personas.visibility, "deleted")
    ),
    with: {
      versions: {
        where: eq(personaVersions.id, versionId),
      },
    },
  });

  if (!maybePersona) {
    throw new Error("Persona not found");
  }

  if (maybePersona.versions.length === 0) {
    throw new Error("Version not found");
  }

  const { versions, ...persona } = maybePersona;

  return {
    ...persona,
    version: versions[0] as PersonaVersion,
  };
};
