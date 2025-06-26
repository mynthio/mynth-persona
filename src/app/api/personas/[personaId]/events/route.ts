import { db } from "@/db/drizzle";
import { personaEvents, personas } from "@/db/schema";
import { logger } from "@/lib/logger";
import { getPersonaEventsById } from "@/services/persona-events/get-persona-events-by-id";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import "server-only";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId } = await params;

  const personaEventsData = await getPersonaEventsById({
    personaId,
    userId,
  });

  return Response.json(personaEventsData);
}

export type GetPersonaEventsByIdResponse = Awaited<
  ReturnType<typeof getPersonaEventsById>
>;
