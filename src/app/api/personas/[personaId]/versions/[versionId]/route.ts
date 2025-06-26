import { getPersonaWithSpecificVersion } from "@/services/persona/get-persona-with-version";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personaId: string; versionId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId, versionId } = await params;

  const persona = await getPersonaWithSpecificVersion({
    userId,
    personaId,
    versionId,
  });

  if (!persona) {
    return new Response("Persona not found", { status: 404 });
  }

  return Response.json(persona);
}
