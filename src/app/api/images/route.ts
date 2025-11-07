import { db } from "@/db/drizzle";
import { media } from "@/db/schema";
import { transformToPublicPersonaImages } from "@/schemas/transformers";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get filters from search params
  const personaId = request.nextUrl.searchParams.get("personaId");
  const chatId = request.nextUrl.searchParams.get("chatId");

  // At least one filter is required
  if (!personaId && !chatId) {
    return new Response("personaId or chatId is required", { status: 400 });
  }

  // Build where clause - userId filter ensures user owns the media
  const whereConditions = [
    eq(media.type, "image"),
    eq(media.userId, userId),
  ];

  if (personaId) {
    whereConditions.push(eq(media.personaId, personaId));
  }

  if (chatId) {
    whereConditions.push(eq(media.chatId, chatId));
  }

  // Fetch media, newest first
  const personaMedia = await db.query.media.findMany({
    where: and(...whereConditions),
    columns: { id: true },
    orderBy: desc(media.createdAt),
  });

  const publicImages = transformToPublicPersonaImages(personaMedia);

  return Response.json(publicImages);
}
