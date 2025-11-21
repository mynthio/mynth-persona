import { db } from "@/db/drizzle";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;

    // Get media with persona and user details
    const mediaData = await db.query.media.findFirst({
      where: eq(media.id, mediaId),
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
        generation: true,
      },
    });

    if (!mediaData) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Build privacy-aware response
    const response: any = {
      id: mediaData.id,
      tags: mediaData.tags,
      nsfw: mediaData.nsfw,
      likesCount: mediaData.likesCount,
      commentsCount: mediaData.commentsCount,
      createdAt: mediaData.createdAt,
      visibility: mediaData.visibility,
    };

    // Include persona link only if persona is public
    if (mediaData.persona?.visibility === "public") {
      response.persona = {
        id: mediaData.persona.id,
        profileImageIdMedia: mediaData.persona.profileImageIdMedia,
      };
    }

    // Include user only if not anonymous
    if (!mediaData.isCreatorAnonymous && mediaData.user) {
      response.user = {
        id: mediaData.user.id,
        username: mediaData.user.username,
        displayName: mediaData.user.displayName,
        imageUrl: mediaData.user.imageUrl,
      };
    }

    // Include generation details if available
    if (mediaData.generation) {
      response.generation = {
        id: mediaData.generation.id,
        status: mediaData.generation.status,
        cost: mediaData.generation.cost,
        createdAt: mediaData.generation.createdAt,
        completedAt: mediaData.generation.completedAt,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
