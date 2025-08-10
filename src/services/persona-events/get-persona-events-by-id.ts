import "server-only";

import { db } from "@/db/drizzle";
import { personaEvents } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";

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
      eq(personaEvents.userId, userId),
      or(
        eq(personaEvents.type, "persona_create"),
        eq(personaEvents.type, "persona_edit"),
        eq(personaEvents.type, "persona_revert"),
        eq(personaEvents.type, "persona_clone")
      )
    ),
    with: {
      version: {
        columns: {
          id: true,
          versionNumber: true,
          title: true,
        },
      },
    },
  });

  return personaEventsData;
};

export type GetPersonaEventsByIdData = Awaited<
  ReturnType<typeof getPersonaEventsById>
>;
