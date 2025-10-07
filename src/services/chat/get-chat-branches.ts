import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";
import { ROOT_BRANCH_PARENT_ID } from "@/lib/constants";

export type BranchesByParent = Record<
  string,
  { id: string; createdAt: string | Date }[]
>;

export async function getChatBranches(
  chatId: string
): Promise<BranchesByParent> {
  const result = await db.execute(
    sql<{ parent_id: string | null; children: unknown }>`
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
      group by m.parent_id
      having count(*) > 1;
    `
  );

  const branchesByParent: BranchesByParent = {};

  for (const row of result.rows as {
    parent_id: string | null;
    children: unknown;
  }[]) {
    const parsed =
      typeof row.children === "string"
        ? JSON.parse(row.children as string)
        : row.children;

    const children = Array.isArray(parsed)
      ? (parsed as any[]).map((b) => ({
          id: b.id as string,
          createdAt: b.created_at as string,
        }))
      : [];

    const key = row.parent_id ?? ROOT_BRANCH_PARENT_ID;
    branchesByParent[key] = children;
  }

  return branchesByParent;
}
