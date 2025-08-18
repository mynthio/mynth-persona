import { db } from "@/db/drizzle";
import { chats, messages, personas } from "@/db/schema";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ personaId: string; chatId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { personaId, chatId } = await params;

  // Validate persona ownership first
  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.id, personaId), eq(personas.userId, userId)),
    columns: { id: true },
  });

  if (!persona) {
    return new Response("Persona not found", { status: 404 });
  }

  // Validate chat belongs to persona and user
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    columns: { id: true },
  });

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  const url = new URL(req.url);
  const leafIdFromQuery =
    url.searchParams.get("leaf_id") ??
    url.searchParams.get("leafId") ??
    undefined;

  // If leaf_id not provided, use the latest message in the chat
  let leafId = leafIdFromQuery ?? null;

  if (!leafId) {
    const latest = await db.query.messages.findFirst({
      where: eq(messages.chatId, chatId),
      orderBy: [desc(messages.createdAt)],
      columns: { id: true },
    });

    if (!latest) {
      // No messages in chat
      return Response.json({ leafId: null, messages: [] });
    }

    leafId = latest.id;
  } else {
    // Validate provided leafId belongs to this chat
    const exists = await db.query.messages.findFirst({
      where: and(eq(messages.id, leafId), eq(messages.chatId, chatId)),
      columns: { id: true },
    });

    if (!exists) {
      return new Response("Leaf message not found", { status: 404 });
    }
  }

  // Recursive query: walk parents from leaf to root, then order root -> leaf
  const result = await db.execute(
    sql<{
      id: string;
      parent_id: string | null;
      chat_id: string;
      role: string;
      parts: any;
      created_at: Date;
      updated_at: Date;
      depth: number;
    }>`
      with recursive thread as (
        select m.id, m.parent_id, m.chat_id, m.role, m.parts, m.created_at, m.updated_at, 1 as depth
        from messages m
        where m.id = ${leafId} and m.chat_id = ${chatId}
        union all
        select pm.id, pm.parent_id, pm.chat_id, pm.role, pm.parts, pm.created_at, pm.updated_at, thread.depth + 1
        from messages pm
        join thread on thread.parent_id = pm.id
      )
      select id, parent_id, chat_id, role, parts, created_at, updated_at, depth
      from thread
      order by depth desc
      limit 20;
    `
  );

  const items = result.rows.map((r) => ({
    id: r.id,
    parentId: r.parent_id,
    chatId: r.chat_id,
    role: r.role as "user" | "assistant" | string,
    parts: r.parts,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  logger.debug({
    messages: items.map((i) => ({
      ...i,
      parts: JSON.stringify(i.parts || {}).slice(0, 100),
    })),
  });

  return Response.json({ leafId, messages: items });
}
