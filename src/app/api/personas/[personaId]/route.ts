import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
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

  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.id, personaId), eq(personas.userId, userId)),
    with: {
      currentVersion: true,
    },
  });

  if (!persona) {
    return new Response("Persona not found", { status: 404 });
  }

  return Response.json(persona);
}
