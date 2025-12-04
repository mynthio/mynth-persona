import { db } from "@/db/drizzle";
import { media, mediaGenerations } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageId } = await params;

    // Get media with its generation details
    const mediaData = await db.query.media.findFirst({
      where: and(eq(media.id, imageId), eq(media.userId, userId)),
      with: {
        persona: {
          columns: {
            id: true,
            title: true,
            userId: true,
          },
        },
        generation: true,
      },
    });

    if (!mediaData) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const response = {
      id: mediaData.id,
      personaId: mediaData.personaId,
      createdAt: mediaData.createdAt,
      tags: mediaData.tags,
      nsfw: mediaData.nsfw,
      visibility: mediaData.visibility,
      persona: mediaData.persona
        ? {
            id: mediaData.persona.id,
            title: mediaData.persona.title,
          }
        : null,
      generation: mediaData.generation
        ? {
            id: mediaData.generation.id,
            prompt: (mediaData.generation.metadata as any)?.prompt || null,
            aiModel: (mediaData.generation.metadata as any)?.aiModel || null,
            status: mediaData.generation.status,
            tokensCost: mediaData.generation.cost,
            errorMessage: null,
            settings: mediaData.generation.settings,
            createdAt: mediaData.generation.createdAt,
            completedAt: mediaData.generation.completedAt,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
