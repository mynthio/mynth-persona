import { db } from "@/db/drizzle";
import { images, imageGenerations } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
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

    // Get image with its generation details
    const imageData = await db.query.images.findFirst({
      where: eq(images.id, imageId),
      with: {
        persona: {
          columns: {
            id: true,
            title: true,
            userId: true,
          },
        },
      },
    });

    if (!imageData) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Check if user owns the persona that the image belongs to
    if (imageData.persona.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the image generation details
    const generationData = await db.query.imageGenerations.findFirst({
      where: eq(imageGenerations.imageId, imageId),
    });

    const response = {
      id: imageData.id,
      personaId: imageData.personaId,
      createdAt: imageData.createdAt,
      persona: {
        id: imageData.persona.id,
        title: imageData.persona.title,
      },
      generation: generationData
        ? {
            id: generationData.id,
            prompt: generationData.prompt,
            aiModel: generationData.aiModel,
            status: generationData.status,
            tokensCost: generationData.tokensCost,
            errorMessage: generationData.errorMessage,
            settings: generationData.settings,
            createdAt: generationData.createdAt,
            completedAt: generationData.completedAt,
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
