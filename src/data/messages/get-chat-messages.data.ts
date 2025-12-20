import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";
import { getLatestLeafForChat } from "./get-latest-leaf-for-chat.data";
import { getLatestLeafForMessage } from "./get-latest-leaf-for-message.data";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";

export type GetChatMessagesOptions = {
  messageId?: string | null;
  limit?: number; // how many messages to fetch in the thread (root -> leaf)
  strict?: boolean; // if true and messageId is provided, fetch history strictly up to this message (do not resolve latest leaf)
};

type GetChatMessagesResponseData = {
  leafId: string | null;
  messages: PersonaUIMessage[];
};

export async function getChatMessagesData(
  chatId: string,
  { messageId, limit, strict }: GetChatMessagesOptions = {}
): Promise<GetChatMessagesResponseData> {
  // Determine the leafId to use for the thread
  const leafId = messageId
    ? strict
      ? messageId
      : await getLatestLeafForMessage(chatId, messageId)
    : await getLatestLeafForChat(chatId);

  if (!leafId) {
    return { leafId: null, messages: [] };
  }

  const effectiveLimit =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : 200;

  // Recursive query: walk parents from leaf to root, then select the N newest (closest to leaf) and return them oldest -> newest within that window
  const result = await db.execute(
    sql<{
      id: string;
      parent_id: string | null;
      chat_id: string;
      role: string;
      parts: unknown;
      created_at: Date;
      updated_at: Date;
      metadata: PersonaUIMessage["metadata"];
      depth: number;
    }>`
      with recursive thread as (
        select m.id, m.parent_id, m.chat_id, m.role, m.parts, m.created_at, m.updated_at, m.metadata, 1 as depth
        from messages m
        where m.id = ${leafId} and m.chat_id = ${chatId}
        union all
        select pm.id, pm.parent_id, pm.chat_id, pm.role, pm.parts, pm.created_at, pm.updated_at, pm.metadata, thread.depth + 1
        from messages pm
        join thread on thread.parent_id = pm.id
      )
      select id, parent_id, chat_id, role, parts, created_at, updated_at, metadata, depth
      from (
        select id, parent_id, chat_id, role, parts, created_at, updated_at, metadata, depth
        from thread
        order by depth asc
        limit ${effectiveLimit}
      ) limited
      order by depth desc;
    `
  );

  const items: PersonaUIMessage[] = result.rows.map((r) => {
    const metadata = r.metadata as PersonaUIMessage["metadata"] | null;

    return {
      id: r.id as string,
      role: r.role as PersonaUIMessage["role"],
      parts: r.parts as PersonaUIMessage["parts"],
      metadata: {
        parentId: r.parent_id as string | null,
        media: metadata?.media,
        usage: metadata?.usage ?? {},
        checkpoint: metadata?.checkpoint,
      },
    } satisfies PersonaUIMessage;
  });

  return { leafId, messages: items };
}
