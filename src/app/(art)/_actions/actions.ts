"use server";

import { auth } from "@clerk/nextjs/server";
import { media, mediaComments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db/drizzle";
import { getImageUrl } from "@/lib/utils";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { nanoid } from "nanoid";

const publishMediaSchema = z.object({
  mediaId: z.string(),
  isCreatorAnonymous: z.boolean().default(false),
});

export async function publishMediaAction(
  input: z.infer<typeof publishMediaSchema>
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { mediaId, isCreatorAnonymous } = input;

  try {
    // 1. Fetch media to ensure it exists and belongs to user
    const existingMedia = await db.query.media.findFirst({
      where: and(eq(media.id, mediaId), eq(media.userId, userId)),
      with: {
        generation: true,
      },
    });

    if (!existingMedia) {
      return { success: false, error: "Media not found" };
    }

    if (existingMedia.visibility === "public") {
      return { success: false, error: "Media is already published" };
    }

    if (existingMedia.visibility === "deleted") {
      return { success: false, error: "Cannot publish deleted media" };
    }

    // 2. Get image URL
    const imageUrl = getImageUrl(mediaId, "full");

    const openrouter = getOpenRouter();

    // 3. Generate tags and NSFW rating using AI
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash-lite-preview-09-2025"),
      schema: z.object({
        tags: z
          .array(z.string())
          .describe("List of 5-10 descriptive tags for the image"),
        nsfw: z
          .enum(["sfw", "suggestive", "explicit"])
          .describe("NSFW rating of the image"),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide descriptive tags and NSFW rating.\n\nIMPORTANT for NSFW rating: Any nudity, including visible nipples or exposed genitalia, should be rated as 'explicit'. Suggestive content (revealing clothing, sexual poses without nudity) should be 'suggestive'. Everything else is 'sfw'.\n\nFor tags, ALWAYS include these predefined tags where applicable:\n- Style: 'realistic' or 'anime'\n- Gender: 'male', 'female', or 'unknown'\n\nAdditionally, describe physical characteristics in simple, searchable tags:\n- Hair (color and style): e.g., 'blonde hair', 'long hair', 'short black hair'\n- Body type: e.g., 'petite', 'curvy', 'muscular', 'slim'\n- Clothing: e.g., 'dress', 'casual', 'fantasy armor', 'swimwear'\n- Other notable features: e.g., 'glasses', 'tattoos', 'elf ears'\n\nKeep tags concise and focused on the most prominent, searchable features.",
            },
            { type: "image", image: imageUrl },
          ],
        },
      ],
    });

    // 4. Update media record
    await db
      .update(media)
      .set({
        visibility: "public",
        tags: object.tags,
        nsfw: object.nsfw,
        isCreatorAnonymous,
      })
      .where(eq(media.id, mediaId));

    revalidatePath("/art");
    revalidatePath("/library/images");

    return { success: true };
  } catch (error) {
    console.error("Error publishing media:", error);
    return { success: false, error: "Failed to publish media" };
  }
}

const createMediaCommentSchema = z.object({
  mediaId: z.string(),
  content: z.string().min(1).max(500),
});

export async function createMediaCommentAction(
  input: z.infer<typeof createMediaCommentSchema>
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { mediaId, content } = input;

  try {
    // Verify media exists
    const existingMedia = await db.query.media.findFirst({
      where: eq(media.id, mediaId),
    });

    if (!existingMedia) {
      return { success: false, error: "Media not found" };
    }

    // Create comment
    const [comment] = await db
      .insert(mediaComments)
      .values({
        id: nanoid(),
        mediaId,
        userId,
        content: content.trim(),
      })
      .returning();

    // Update comment count on media
    await db
      .update(media)
      .set({
        commentsCount: existingMedia.commentsCount + 1,
      })
      .where(eq(media.id, mediaId));

    // Fetch the comment with user data
    const commentWithUser = await db.query.mediaComments.findFirst({
      where: eq(mediaComments.id, comment.id),
      with: {
        user: true,
      },
    });

    return { success: true, comment: commentWithUser };
  } catch (error) {
    console.error("Error creating comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

const unpublishMediaSchema = z.object({
  mediaId: z.string(),
});

export async function unpublishMediaAction(
  input: z.infer<typeof unpublishMediaSchema>
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { mediaId } = input;

  try {
    const result = await db
      .update(media)
      .set({
        visibility: "private",
      })
      .where(
        and(
          eq(media.id, mediaId),
          eq(media.userId, userId),
          eq(media.visibility, "public")
        )
      )
      .returning({ id: media.id });

    if (result.length === 0) {
      return { success: false, error: "Media not found or not published" };
    }

    revalidatePath("/art");
    revalidatePath("/library/images");

    return { success: true };
  } catch (error) {
    console.error("Error unpublishing media:", error);
    return { success: false, error: "Failed to unpublish media" };
  }
}

const deleteMediaCommentSchema = z.object({
  commentId: z.string(),
});

export async function deleteMediaCommentAction(
  input: z.infer<typeof deleteMediaCommentSchema>
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { commentId } = input;

  try {
    // Verify comment exists and belongs to user
    const existingComment = await db.query.mediaComments.findFirst({
      where: eq(mediaComments.id, commentId),
    });

    if (!existingComment) {
      return { success: false, error: "Comment not found" };
    }

    if (existingComment.userId !== userId) {
      return { success: false, error: "Unauthorized to delete this comment" };
    }

    // Delete comment
    await db.delete(mediaComments).where(eq(mediaComments.id, commentId));

    // Update comment count on media
    const existingMedia = await db.query.media.findFirst({
      where: eq(media.id, existingComment.mediaId),
    });

    if (existingMedia) {
      await db
        .update(media)
        .set({
          commentsCount: Math.max(0, existingMedia.commentsCount - 1),
        })
        .where(eq(media.id, existingComment.mediaId));
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}
