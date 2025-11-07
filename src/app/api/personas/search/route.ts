import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, ne, lt, or, ilike, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

const PERSONAS_PER_PAGE = 20;

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const cursorCreatedAtParam = url.searchParams.get("cursorCreatedAt");
  const cursorIdParam = url.searchParams.get("cursorId");
  const q = url.searchParams.get("q") ?? undefined;
  const filterType = url.searchParams.get("filter") ?? "all"; // "all" or "mine"

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

  // Base condition depends on filter type
  const baseCondition =
    filterType === "mine"
      ? and(eq(personas.userId, userId), ne(personas.visibility, "deleted"))
      : or(
          // User's own personas (including private)
          and(eq(personas.userId, userId), ne(personas.visibility, "deleted")),
          // Public personas from other users
          and(
            ne(personas.userId, userId),
            eq(personas.visibility, "public"),
            isNotNull(personas.publishedAt)
          )
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
        and(
          eq(personas.createdAt, cursor.createdAt),
          lt(personas.id, cursor.id)
        )
      )
    : undefined;

  const conditions = [
    baseCondition,
    searchCondition,
    paginationCondition,
  ].filter((c): c is NonNullable<typeof c> => c != null);
  const whereCondition = and(...conditions);

  const data = await db
    .select({
      id: personas.id,
      title: personas.title,
      publicName: personas.publicName,
      headline: personas.headline,
      currentVersionId: personas.currentVersionId,
      profileImageIdMedia: personas.profileImageIdMedia,
      profileSpotlightMediaId: personas.profileSpotlightMediaId,
      gender: personas.gender,
      ageBucket: personas.ageBucket,
      userId: personas.userId,
      visibility: personas.visibility,
      createdAt: personas.createdAt,
    })
    .from(personas)
    .where(whereCondition)
    .orderBy(desc(personas.createdAt), desc(personas.id))
    .limit(PERSONAS_PER_PAGE + 1);

  const hasMore = data.length > PERSONAS_PER_PAGE;
  const pageRows = data.slice(0, PERSONAS_PER_PAGE);

  // Mark which personas are owned by the current user
  const results = pageRows.map((persona) => ({
    ...persona,
    isOwned: persona.userId === userId,
  }));

  let nextCreatedAt: string | null = null;
  let nextId: string | null = null;
  if (hasMore && pageRows.length > 0) {
    const lastItem = pageRows[pageRows.length - 1]!;
    nextCreatedAt = lastItem.createdAt?.toISOString() ?? null;
    nextId = lastItem.id ?? null;
  }

  return NextResponse.json({
    data: results,
    nextCreatedAt,
    nextId,
    hasMore,
  });
}
