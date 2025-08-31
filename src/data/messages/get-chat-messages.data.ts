import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";
import {
  messageListItemSchema,
  type MessageThreadResponse,
} from "@/schemas/backend/messages/message.schema";
import { getLatestLeafForChat } from "./get-latest-leaf-for-chat.data";
import { getLatestLeafForMessage } from "./get-latest-leaf-for-message.data";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import { ParseIssueTitleAnnotationId } from "effect/SchemaAST";

export type GetChatMessagesOptions = {
  messageId?: string | null;
  limit?: number; // how many messages to fetch in the thread (root -> leaf)
};

type GetChatMessagesResponseData = {
  leafId: string | null;
  messages: PersonaUIMessage[];
};

export async function getChatMessagesData(
  chatId: string,
  { messageId, limit }: GetChatMessagesOptions = {}
): Promise<GetChatMessagesResponseData> {
  // Determine the leafId to use for the thread
  const leafId = messageId
    ? await getLatestLeafForMessage(chatId, messageId)
    : await getLatestLeafForChat(chatId);

  if (!leafId) {
    return { leafId: null, messages: [] };
  }

  const effectiveLimit =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : 200;

  // Recursive query: walk parents from leaf to root, then order root -> leaf
  const result = await db.execute(
    sql<{
      id: string;
      parent_id: string | null;
      chat_id: string;
      role: string;
      parts: unknown;
      created_at: Date;
      updated_at: Date;
      metadata: any;
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
      limit ${effectiveLimit};
    `
  );

  const items = result.rows.map(
    (r) =>
      ({
        id: r.id as string,

        role: r.role as PersonaUIMessage["role"],
        parts: r.parts as any,

        metadata: {
          parentId: r.parent_id as string | null,
        },
      } satisfies PersonaUIMessage)
  );

  return { leafId, messages: items };
}
