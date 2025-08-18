import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";

/**
 * Walk down from a given messageId within a chat to find the latest leaf descendant.
 * If the provided message is already a leaf, it returns that same id.
 */
export async function getLatestLeafForMessage(
  chatId: string,
  messageId: string
): Promise<string | null> {
  const res = await db.execute(
    sql<{ id: string }>`
      with recursive chain as (
        select m.id, m.parent_id, m.chat_id, m.created_at, 1 as depth
        from messages m
        where m.id = ${messageId} and m.chat_id = ${chatId}
        union all
        select c.id, c.parent_id, c.chat_id, c.created_at, chain.depth + 1
        from chain
        join lateral (
          select *
          from messages
          where parent_id = chain.id and chat_id = ${chatId}
          order by created_at desc
          limit 1
        ) c on true
      )
      select id
      from chain
      order by depth desc
      limit 1;
    `
  );

  return (res.rows[0]?.id as string | undefined) ?? null;
}
