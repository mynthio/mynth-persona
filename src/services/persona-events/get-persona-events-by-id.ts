import "server-only";

import { db } from "@/db/drizzle";
import { personaEvents } from "@/db/schema";
import { and, eq } from "drizzle-orm";

type GetPersonaEventsByIdParams = {
  personaId: string;
  userId: string;
};

export const getPersonaEventsById = async ({
  personaId,
  userId,
}: GetPersonaEventsByIdParams) => {
  const personaEventsData = await db.query.personaEvents.findMany({
    where: and(
      eq(personaEvents.personaId, personaId),
      eq(personaEvents.userId, userId)
    ),
    with: {
      version: {
        columns: {
          versionNumber: true,
          title: true,
        },
      },
      imageGenerations: {
        columns: {
          id: true,
          status: true,
          runId: true,
          imageId: true,
        },
      },
    },
  });

  return personaEventsData;
};
