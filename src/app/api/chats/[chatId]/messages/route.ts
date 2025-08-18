import { db } from "@/db/drizzle";
import { chats, messages } from "@/db/schema";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { chatId } = await params;

  // Validate chat belongs to user
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    columns: { id: true },
  });

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  const url = new URL(req.url);
  // Accept a message ID (not necessarily a leaf). UI can send `message_id` or `messageId`.
  const messageIdFromQuery =
    url.searchParams.get("message_id") ??
    url.searchParams.get("messageId") ??
    undefined;

  // Optional: how many messages to fetch (root -> leaf)
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  if (messageIdFromQuery) {
    // Validate provided messageId belongs to this chat
    const exists = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, messageIdFromQuery),
        eq(messages.chatId, chatId)
      ),
      columns: { id: true },
    });

    if (!exists) {
      return new Response("Message not found", { status: 404 });
    }
  }

  const { leafId, messages: items } = await getChatMessagesData(chatId, {
    messageId: messageIdFromQuery ?? null,
    limit,
  });

  if (messageIdFromQuery && !leafId) {
    return new Response("Leaf message not found", { status: 404 });
  }

  if (!leafId) {
    // No messages in chat
    return Response.json({ leafId: null, messages: [] });
  }

  logger.debug({
    messages: items.map((i) => ({
      ...i,
      parts: JSON.stringify(i.parts || {}).slice(0, 100),
    })),
  });

  return Response.json({ leafId, messages: items });
}
