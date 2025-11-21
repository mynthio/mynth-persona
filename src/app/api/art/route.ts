import { db } from "@/db/drizzle";
import { media } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const nsfwParams = searchParams.get("nsfw");
  const tagsParam = searchParams.get("tags");
  const limit = 20;

  const offset = cursor ? parseInt(cursor) * limit : 0;

  const nsfwLevels = nsfwParams
    ? nsfwParams.split(",").map((level) => level.trim())
    : [];
  const validNsfwLevels = nsfwLevels.filter((level) =>
    ["sfw", "suggestive", "explicit"].includes(level)
  ) as ("sfw" | "suggestive" | "explicit")[];

  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  try {
    const whereConditions = [
      eq(media.visibility, "public"),
      eq(media.type, "image"),
    ];

    if (validNsfwLevels.length > 0) {
      whereConditions.push(inArray(media.nsfw, validNsfwLevels));
    }

    if (tags.length > 0) {
      // Check if media.tags contains all tags from the query
      // Use PostgreSQL array constructor with proper parameterization
      // The @> operator checks if the left array contains all elements of the right array
      whereConditions.push(
        sql`${media.tags} @> ARRAY[${sql.join(
          tags.map((tag) => sql`${tag}`),
          sql`, `
        )}]::text[]`
      );
    }

    const items = await db.query.media.findMany({
      where: and(...whereConditions),
      orderBy: [desc(media.publishedAt)],
      limit: limit,
      offset: offset,
      with: {
        persona: {
          columns: {
            id: true,
            visibility: true,
            profileImageIdMedia: true,
          },
        },
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            imageUrl: true,
          },
        },
      },
    });

    // Filter response based on privacy settings
    const filteredItems = items.map((item) => {
      const response: any = {
        id: item.id,
        tags: item.tags,
        likesCount: item.likesCount,
        commentsCount: item.commentsCount,
        nsfw: item.nsfw,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
      };

      // Include persona link only if persona is public
      if (item.persona?.visibility === "public") {
        response.persona = {
          id: item.persona.id,
          profileImageIdMedia: item.persona.profileImageIdMedia,
        };
      }

      // Include user only if not anonymous
      if (!item.isCreatorAnonymous && item.user) {
        response.user = {
          id: item.user.id,
          username: item.user.username,
          displayName: item.user.displayName,
          imageUrl: item.user.imageUrl,
        };
      }

      return response;
    });

    const nextCursor =
      items.length === limit ? (cursor ? parseInt(cursor) + 1 : 1) : undefined;

    return NextResponse.json({
      items: filteredItems,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching art:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
