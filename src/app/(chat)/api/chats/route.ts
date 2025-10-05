import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import { transformToPublicChats } from "@/schemas/transformers";

const CHATS_PER_PAGE = 50;

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const cursorUpdatedAtParam = url.searchParams.get("cursorUpdatedAt");
  const cursorIdParam = url.searchParams.get("cursorId");
  const q = url.searchParams.get("q") ?? undefined;

  // Parse cursor if both params are present
  let cursor:
    | {
        id: string;
        updatedAt: Date;
      }
    | undefined;
  if (cursorUpdatedAtParam && cursorIdParam) {
    const updatedAtDate = new Date(cursorUpdatedAtParam);
    if (isNaN(updatedAtDate.getTime())) {
      return new Response("Invalid cursorUpdatedAt format", { status: 400 });
    }
    cursor = { id: cursorIdParam, updatedAt: updatedAtDate };
  }

  const baseCondition = eq(chats.userId, userId);

  const searchCondition = q ? ilike(chats.title, `%${q}%`) : undefined;

  const paginationCondition = cursor
    ? or(
        lt(chats.updatedAt, cursor.updatedAt),
        and(eq(chats.updatedAt, cursor.updatedAt), lt(chats.id, cursor.id))
      )
    : undefined;

  const conditions = [baseCondition, searchCondition, paginationCondition].filter(
    (c): c is NonNullable<typeof c> => c != null
  );
  const whereCondition = and(...conditions);

  const data = await db
    .select({
      id: chats.id,
      title: chats.title,
      mode: chats.mode,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(whereCondition)
    .orderBy(desc(chats.updatedAt), desc(chats.id))
    .limit(CHATS_PER_PAGE + 1);

  const hasMore = data.length > CHATS_PER_PAGE;
  const pageRows = data.slice(0, CHATS_PER_PAGE);

  let nextUpdatedAt: string | null = null;
  let nextId: string | null = null;
  if (hasMore && pageRows.length > 0) {
    const lastItem = pageRows[pageRows.length - 1]!;
    nextUpdatedAt = lastItem.updatedAt?.toISOString() ?? null;
    nextId = lastItem.id ?? null;
  }

  return Response.json({
    data: transformToPublicChats(pageRows),
    nextUpdatedAt,
    nextId,
    hasMore,
  });
}