import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, ne, lt, or, ilike } from "drizzle-orm";

const PERSONAS_PER_PAGE = 24;

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const cursorCreatedAtParam = url.searchParams.get("cursorCreatedAt");
  const cursorIdParam = url.searchParams.get("cursorId");
  const q = url.searchParams.get("q") ?? undefined;

  // Parse cursor if both params are present
  let cursor:
    | {
        id: string;
        createdAt: Date;
      }
    | undefined;
  if (cursorCreatedAtParam && cursorIdParam) {
    const createdAtDate = new Date(cursorCreatedAtParam);
    if (isNaN(createdAtDate.getTime())) {
      return new Response("Invalid cursorCreatedAt format", { status: 400 });
    }
    cursor = { id: cursorIdParam, createdAt: createdAtDate };
  }

  const baseCondition = and(
    eq(personas.userId, userId),
    ne(personas.visibility, "deleted")
  );

  const searchCondition = q
    ? or(
        ilike(personas.title, `%${q}%`),
        ilike(personas.headline, `%${q}%`),
        ilike(personas.publicName, `%${q}%`)
      )
    : undefined;

  const paginationCondition = cursor
    ? or(
        lt(personas.createdAt, cursor.createdAt),
        and(eq(personas.createdAt, cursor.createdAt), lt(personas.id, cursor.id))
      )
    : undefined;

  const whereCondition = and(baseCondition, searchCondition, paginationCondition);

  const data = await db
    .select({
      id: personas.id,
      title: personas.title,
      currentVersionId: personas.currentVersionId,
      profileImageId: personas.profileImageId,
      createdAt: personas.createdAt,
    })
    .from(personas)
    .where(whereCondition)
    .orderBy(desc(personas.createdAt), desc(personas.id))
    .limit(PERSONAS_PER_PAGE + 1);

  const hasMore = data.length > PERSONAS_PER_PAGE;
  const pageRows = data.slice(0, PERSONAS_PER_PAGE);

  let nextCreatedAt: string | null = null;
  let nextId: string | null = null;
  if (hasMore && pageRows.length > 0) {
    const lastItem = pageRows[pageRows.length - 1]!;
    nextCreatedAt = lastItem.createdAt?.toISOString() ?? null;
    nextId = lastItem.id ?? null;
  }

  return Response.json({
    data: pageRows,
    nextCreatedAt,
    nextId,
    hasMore,
  });
}
