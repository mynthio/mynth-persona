import { db } from "@/db/drizzle";
import { chatPersonas, chats, personas } from "@/db/schema";
import { logger } from "@/lib/logger";
import { transformToPublicChats } from "@/schemas/transformers";
import { auth } from "@clerk/nextjs/server";
import { and, eq, desc, ne } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId } = await params;

  // First verify that the persona belongs to the user
  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.id, personaId), eq(personas.userId, userId), ne(personas.visibility, "deleted")),
  });

  if (!persona) {
    return new Response("Persona not found", { status: 404 });
  }

  // Get all chats for this persona, ordered by most recent first
  const userChats = await db.query.chatPersonas.findMany({
    where: and(eq(chatPersonas.personaId, personaId)),
    orderBy: [desc(chats.updatedAt)],
    with: {
      chat: true,
    },
  });

  logger.debug({
    userChats,
  });

  const userChatsData = userChats.map((c) => ({
    ...c.chat,
  }));

  const publicChats = transformToPublicChats(userChatsData);
  return Response.json(publicChats);
}
