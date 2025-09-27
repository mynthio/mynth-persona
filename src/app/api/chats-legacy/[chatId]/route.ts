import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { transformToPublicChatDetail } from "@/schemas/transformers";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { chatId } = await params;

  // Verify the chat belongs to the authenticated user
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
  });

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  const publicChat = transformToPublicChatDetail(chat);
  return Response.json(publicChat);
}
