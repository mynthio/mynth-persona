import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { transformToPublicPersona } from "@/schemas/transformers";
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

  const persona = await db.query.personas.findFirst({
    where: and(
      eq(personas.id, personaId),
      eq(personas.userId, userId),
      ne(personas.visibility, "deleted")
    ),
  });

  if (!persona) {
    return new Response("Persona not found", { status: 404 });
  }

  const publicPersona = transformToPublicPersona(persona as any);
  return Response.json(publicPersona);
}
