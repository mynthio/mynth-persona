import { db } from "@/db/drizzle";
import { personas, personaVersions } from "@/db/schema";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ personaId: string; versionId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId, versionId } = await params;

  const personaVersion = await db.query.personaVersions.findFirst({
    where: and(
      eq(personaVersions.id, versionId),
      eq(personaVersions.personaId, personaId)
    ),
    with: {
      persona: true,
    },
  });

  if (!personaVersion) {
    return new Response("Persona not found", { status: 404 });
  }

  if (personaVersion.persona.userId !== userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  logger.debug(personaVersion, "Persona Version API");

  return Response.json(personaVersion);
}
