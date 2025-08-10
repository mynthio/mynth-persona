import { db } from "@/db/drizzle";
import { personas, personaVersions } from "@/db/schema";
import { transformToPublicPersonaVersion } from "@/schemas/transformers";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personaId: string; versionId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId, versionId } = await params;

  let personaVersion;

  if (versionId === "current") {
    // Get the current version of the persona
    const persona = await db.query.personas.findFirst({
      where: eq(personas.id, personaId),
      columns: {
        userId: true,
        currentVersionId: true,
      },
      with: {
        currentVersion: true,
      },
    });

    if (!persona || persona.userId !== userId) {
      return new Response("Persona not found", { status: 404 });
    }

    if (!persona.currentVersion) {
      return new Response("No current version found", { status: 404 });
    }

    personaVersion = {
      ...persona.currentVersion,
      persona: {
        userId: persona.userId,
      },
    };
  } else {
    // Get specific version by ID
    personaVersion = await db.query.personaVersions.findFirst({
      where: and(
        eq(personaVersions.id, versionId),
        eq(personaVersions.personaId, personaId)
      ),
      with: {
        persona: {
          columns: {
            userId: true,
          },
        },
      },
    });

    const personaOwner = personaVersion?.persona.userId;

    if (!personaVersion || personaOwner !== userId) {
      return new Response("Persona not found", { status: 404 });
    }
  }

  const publicPersonaVersion = transformToPublicPersonaVersion(personaVersion);
  return Response.json(publicPersonaVersion);
}
