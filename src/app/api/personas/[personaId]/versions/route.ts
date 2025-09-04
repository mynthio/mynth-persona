import { db } from "@/db/drizzle";
import { personas, personaVersions } from "@/db/schema";
import { transformToPublicPersonaVersion } from "@/schemas/transformers";
import { auth } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import "server-only";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId } = await params;

  // Verify persona ownership
  const persona = await db.query.personas.findFirst({
    where: eq(personas.id, personaId),
    columns: {
      id: true,
      userId: true,
    },
  });

  if (!persona || persona.userId !== userId) {
    return new Response("Persona not found", { status: 404 });
  }

  // Fetch all versions for the persona, oldest first so newest appears at the bottom of the timeline
  const versions = await db.query.personaVersions.findMany({
    where: eq(personaVersions.personaId, personaId),
    orderBy: [asc(personaVersions.createdAt)],
  });

  const publicVersions = versions.map((v) => transformToPublicPersonaVersion({
    ...v,
    persona: { userId: persona.userId },
  } as any));

  return Response.json(publicVersions);
}