import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNotNull, lt, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { logger } from "@/lib/logger";

const PERSONAS_PER_PAGE = 24; // Testing value

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursorPublishedAtParam = searchParams.get("cursorPublishedAt");
  const cursorIdParam = searchParams.get("cursorId");
  const includeNsfwParam = searchParams.get("includeNsfw");
  const includeNsfw = includeNsfwParam === "true";

  try {
    // Parse cursor if provided (2-param scheme)
    let cursor: { id: string; publishedAt: Date } | undefined;
    if (cursorPublishedAtParam && cursorIdParam) {
      const publishedAtDate = new Date(cursorPublishedAtParam);
      if (isNaN(publishedAtDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid cursorPublishedAt format" },
          { status: 400 }
        );
      }
      cursor = {
        id: cursorIdParam,
        publishedAt: publishedAtDate,
      };
    }

    // NSFW filter: if includeNsfw is false, only allow 'sfw'
    const nsfwCondition = includeNsfw
      ? undefined
      : eq(personas.nsfwRating, "sfw");

    // Build where condition
    const whereCondition = and(
      isNotNull(personas.publishedAt),
      nsfwCondition,
      cursor
        ? or(
            lt(personas.publishedAt, cursor.publishedAt),
            and(
              eq(personas.publishedAt, cursor.publishedAt),
              lt(personas.id, cursor.id)
            )
          )
        : undefined
    );

    // Fetch one extra item to determine if there are more pages
    const data = await db
      .select({
        id: personas.id,
        slug: personas.slug,
        publicName: personas.publicName,
        headline: personas.headline,
        profileImageId: personas.profileImageId,
        nsfwRating: personas.nsfwRating,
        gender: personas.gender,
        ageBucket: personas.ageBucket,
        likesCount: personas.likesCount,
        publishedAt: personas.publishedAt,
      })
      .from(personas)
      .where(whereCondition)
      .orderBy(desc(personas.publishedAt), desc(personas.id))
      .limit(PERSONAS_PER_PAGE + 1);

    // Determine if there are more pages
    const hasMore = data.length > PERSONAS_PER_PAGE;
    const pageRows = data.slice(0, PERSONAS_PER_PAGE);

    // Generate next cursor values from the last item
    let nextPublishedAt: string | null = null;
    let nextId: string | null = null;
    if (hasMore && pageRows.length > 0) {
      const lastItem = pageRows[pageRows.length - 1];
      nextPublishedAt = lastItem.publishedAt?.toISOString() ?? null;
      nextId = lastItem.id ?? null;
    }

    return NextResponse.json({
      data: pageRows,
      hasMore,
      nextPublishedAt,
      nextId,
    });
  } catch (error) {
    logger.error(
      {
        error,
        event: "fetch_public_personas",
        component: "public_personas_route",
        attributes: {
          route: "/api/public/personas",
          handler: "GET",
        },
        payload: {
          cursor_published_at: cursorPublishedAtParam || null,
          cursor_id: cursorIdParam || null,
          include_nsfw: includeNsfw,
        },
      },
      "Error fetching public personas"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
