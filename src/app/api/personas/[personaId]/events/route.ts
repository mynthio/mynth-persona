import { getPersonaEventsById } from "@/services/persona-events/get-persona-events-by-id";
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

  return Response.json(personaEventsData);
}

export type GetPersonaEventsByIdResponse = Awaited<
  ReturnType<typeof getPersonaEventsById>
>;
