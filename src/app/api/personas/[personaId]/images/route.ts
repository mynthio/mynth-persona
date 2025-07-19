import { db } from "@/db/drizzle";
import { images, personas } from "@/db/schema";
import { transformToPublicPersonaImages } from "@/schemas/transformers";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId } = await params;

  // Validate persona ownership
  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.id, personaId), eq(personas.userId, userId)),
    columns: { id: true },
  });

  if (!persona) {
    return new Response("Persona not found", { status: 404 });
  }

  // Fetch images for persona, newest first
  const personaImages = await db.query.images.findMany({
    where: eq(images.personaId, personaId),
    columns: { id: true },
    orderBy: desc(images.createdAt),
  });

  const publicImages = transformToPublicPersonaImages(personaImages);

  return Response.json(publicImages);
}
