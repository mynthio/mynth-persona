import { getPersonaEventsById } from "@/services/persona-events/get-persona-events-by-id";
import { transformToPublicPersonaEvents } from "@/schemas/transformers";
import { auth } from "@clerk/nextjs/server";
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

  // Transform to public format
  const publicPersonaEvents = transformToPublicPersonaEvents(personaEventsData);

  return Response.json(publicPersonaEvents);
}

export type GetPersonaEventsByIdResponse = Awaited<
  ReturnType<typeof getPersonaEventsById>
>;
