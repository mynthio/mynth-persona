import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, ne } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId } = await params;

  // Verify persona ownership and fetch publish-related fields
  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.id, personaId), eq(personas.userId, userId), ne(personas.visibility, "deleted")),
    columns: {
      id: true,
      visibility: true,
      lastPublishAttempt: true,
      publicVersionId: true,
      publicName: true,
      publishedAt: true,
    },
  });

  if (!persona) {
    return new Response("Persona not found", { status: 404 });
  }

  return Response.json({
    visibility: persona.visibility,
    lastPublishAttempt: persona.lastPublishAttempt ?? null,
    publicVersionId: persona.publicVersionId ?? null,
    publicName: persona.publicName ?? null,
    publishedAt: persona.publishedAt ?? null,
  });
}