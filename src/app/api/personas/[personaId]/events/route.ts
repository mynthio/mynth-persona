import { db } from "@/db/drizzle";
import { personaEvents, personas } from "@/db/schema";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId } = await params;

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
      imageGeneration: {
        columns: {
          id: true,
          status: true,
          runId: true,
          imageId: true,
        },
      },
    },
  });

  logger.debug(personaEventsData, "Persona Events API");

  return Response.json(personaEventsData);
}
