import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";

// GET /api/chats/:chatId/branches
// Returns a map of parent message ID -> array of child branches [{ id, createdAt }]
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
    columns: { id: true },
  });

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  // For this endpoint, we only want to expose parents that actually have branching
  // (i.e., 2 or more children). Parents with a single child are not considered branches.
  const result = await db.execute(
    sql<{ parent_id: string; children: unknown }>`
      select
        m.parent_id,
        coalesce(
          json_agg(
            json_build_object('id', m.id, 'created_at', m.created_at)
            order by m.created_at asc
          ) filter (where m.id is not null),
          '[]'::json
        ) as children
      from messages m
      where m.chat_id = ${chatId}
        and m.parent_id is not null
      group by m.parent_id
      having count(*) > 1;
    `
  );

  const branchesByParent: Record<string, { id: string; createdAt: string | Date }[]> = {};

  for (const row of result.rows as { parent_id: string; children: unknown }[]) {
    const parsed = typeof row.children === "string" ? JSON.parse(row.children as string) : row.children;
    const children = Array.isArray(parsed)
      ? (parsed as any[]).map((b) => ({ id: b.id as string, createdAt: (b.created_at as string) }))
      : [];

    branchesByParent[row.parent_id] = children;
  }

  return Response.json(branchesByParent);
}
