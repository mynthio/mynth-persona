import { db } from "@/db/drizzle";
import { mediaComments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;

    // Get all comments for this media
    const comments = await db.query.mediaComments.findMany({
      where: eq(mediaComments.mediaId, mediaId),
      orderBy: [desc(mediaComments.createdAt)],
      with: {
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

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
