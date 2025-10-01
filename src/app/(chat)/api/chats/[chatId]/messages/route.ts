import "server-only";

import { db } from "@/db/drizzle";
import { chats, messages } from "@/db/schema";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";
import { kv } from "@vercel/kv";
import ms from "ms";

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

  const strict = url.searchParams.get("strict") === "true";

  // Optional: how many messages to fetch (root -> leaf)
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam
    ? Math.min(Math.max(Number(limitParam), 100), 10)
    : 25;

  const { leafId, messages: items } = await getChatMessagesData(chatId, {
    messageId: messageIdFromQuery ?? null,
    limit,
    strict,
  });

  if (messageIdFromQuery && !leafId) {
    return new Response("Leaf message not found", { status: 404 });
  }

  if (!leafId) {
    // No messages in chat
    return Response.json({ leafId: null, messages: [] });
  }

  // Set the branch ID so we remember what's the current branch for user
  // remove after 14 days, it's not big deal, as it will fallback to latest message
  // classic behavior. But we will keep redis cleaner.
  const lastMessageId = items.at(-1)?.id;
  if (lastMessageId) {
    await kv.set<string>(`chat:${chatId}:leaf`, lastMessageId, {
      px: ms("14d"),
    });
  }

  logger.debug({
    messages: items.map((i) => ({
      ...i,
      parts: JSON.stringify(i.parts || {}).slice(0, 100),
    })),
  });

  return Response.json({ leafId, messages: items });
}

export type ApiChatMessagesResponse = Awaited<
  ReturnType<typeof getChatMessagesData>
>;
