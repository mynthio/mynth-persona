import { getPersonaWithCurrentVersion } from "@/services/persona/get-persona-with-version";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId } = await params;

  const persona = await getPersonaWithCurrentVersion({
    userId,
    personaId,
  });

  if (!persona) {
    return new Response("Persona not found", { status: 404 });
  }

  return Response.json(persona);
}
