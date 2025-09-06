import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNotNull, lt, or } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { personas } from '@/db/schema';

const PERSONAS_PER_PAGE = 24; // Testing value

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursorParam = searchParams.get('cursor');

    // Parse cursor if provided
    let cursor: { id: string; publishedAt: Date } | undefined;
    if (cursorParam) {
      try {
        const parsed = JSON.parse(cursorParam);
        cursor = {
          id: parsed.id,
          publishedAt: new Date(parsed.publishedAt),
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid cursor format' },
          { status: 400 }
        );
      }
    }

    // Build where condition
    const whereCondition = and(
      isNotNull(personas.publishedAt),
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

    // Generate next cursor from the last item
    let nextCursor: string | null = null;
    if (hasMore && pageRows.length > 0) {
      const lastItem = pageRows[pageRows.length - 1];
      nextCursor = JSON.stringify({
        id: lastItem.id,
        publishedAt: lastItem.publishedAt?.toISOString(),
      });
    }

    return NextResponse.json({
      data: pageRows,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching public personas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
