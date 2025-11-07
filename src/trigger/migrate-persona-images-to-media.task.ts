import { db } from "@/db/drizzle";
import { images, media, mediaGenerations, personas } from "@/db/schema";
import { task } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { uploadToBunny } from "@/lib/upload";
import { logger } from "@/lib/logger";

/**
 * Migration task to move persona images from `images` table to `media` table
 * and migrate files from `/personas/` to `/media/` on CDN
 */
export const migratePersonaImagesToMediaTask = task({
  id: "migrate-persona-images-to-media",
  maxDuration: 3600, // 1 hour for large migrations
  retry: {
    maxAttempts: 1,
  },
  run: async () => {
    const BATCH_SIZE = 50;
    const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_BASE_URL;

    if (!CDN_BASE_URL) {
      throw new Error("NEXT_PUBLIC_CDN_BASE_URL is not set");
    }

    logger.info("Starting persona images to media migration");

    let processedCount = 0;
    let errorCount = 0;
    const errors: Array<{ imageId: string; error: string }> = [];
    const imageIdToMediaIdMap = new Map<string, string>();

    try {
      // Fetch all images in batches
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const imageBatch = await db.query.images.findMany({
          limit: BATCH_SIZE,
          offset,
          with: {
            persona: true,
          },
        });

        if (imageBatch.length === 0) {
          hasMore = false;
          break;
        }

        logger.info(
          `Processing batch: ${offset + 1} to ${offset + imageBatch.length}`
        );

        // Process each image in the batch
        for (const image of imageBatch) {
          try {
            const oldImageId = image.id;
            const newMediaId = `med_${nanoid(32)}`;

            logger.info(`Migrating image ${oldImageId} to media ${newMediaId}`);

            // Download full image from CDN
            const fullImageUrl = `${CDN_BASE_URL}/personas/${oldImageId}.webp`;
            const fullImageResponse = await fetch(fullImageUrl);

            if (!fullImageResponse.ok) {
              throw new Error(
                `Failed to download full image: ${fullImageResponse.status} ${fullImageResponse.statusText}`
              );
            }

            const fullImageBuffer = Buffer.from(
              await fullImageResponse.arrayBuffer()
            );

            // Download thumbnail from CDN
            const thumbImageUrl = `${CDN_BASE_URL}/personas/${oldImageId}_thumb.webp`;
            const thumbImageResponse = await fetch(thumbImageUrl);

            if (!thumbImageResponse.ok) {
              throw new Error(
                `Failed to download thumbnail: ${thumbImageResponse.status} ${thumbImageResponse.statusText}`
              );
            }

            const thumbImageBuffer = Buffer.from(
              await thumbImageResponse.arrayBuffer()
            );

            // Upload to new media paths
            const mainFilePath = `media/${newMediaId}.webp`;
            const thumbnailFilePath = `media/${newMediaId}_thumb.webp`;

            await Promise.all([
              uploadToBunny(mainFilePath, fullImageBuffer),
              uploadToBunny(thumbnailFilePath, thumbImageBuffer),
            ]);

            logger.info(`Uploaded files to ${mainFilePath}`);

            // Create mediaGenerations record
            const mediaGenerationId = `mdg_${nanoid()}`;
            await db.insert(mediaGenerations).values({
              id: mediaGenerationId,
              metadata: {
                migratedFrom: "images",
                legacyImageId: oldImageId,
                personaId: image.personaId,
              },
              settings: {},
              cost: 0,
              status: "success",
              createdAt: image.createdAt,
              updatedAt: image.createdAt,
              completedAt: image.createdAt,
            });

            logger.info(`Created mediaGeneration ${mediaGenerationId}`);

            // Create media record
            await db.insert(media).values({
              id: newMediaId,
              personaId: image.personaId,
              userId: image.persona.userId,
              generationId: mediaGenerationId,
              visibility: "private",
              metadata: {
                legacyImageId: oldImageId,
                messageId: image.messageId,
              },
              type: "image",
              nsfw: image.isNSFW ? "explicit" : "sfw",
              createdAt: image.createdAt,
            });

            logger.info(`Created media record ${newMediaId}`);

            // Track mapping for profile image updates
            imageIdToMediaIdMap.set(oldImageId, newMediaId);

            processedCount++;
          } catch (error) {
            errorCount++;
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            errors.push({
              imageId: image.id,
              error: errorMessage,
            });
            logger.error(`Error migrating image ${image.id}: ${errorMessage}`);
          }
        }

        offset += BATCH_SIZE;
      }

      logger.info("Image migration complete, updating profile images");

      // Update persona profile images
      let profileUpdateCount = 0;
      const personasWithImages = await db.query.personas.findMany({
        where: (personas, { isNotNull }) => isNotNull(personas.profileImageId),
      });

      for (const persona of personasWithImages) {
        if (persona.profileImageId) {
          const newMediaId = imageIdToMediaIdMap.get(persona.profileImageId);

          if (newMediaId) {
            await db
              .update(personas)
              .set({
                profileImageIdMedia: newMediaId,
              })
              .where(eq(personas.id, persona.id));

            profileUpdateCount++;
            logger.info(
              `Updated persona ${persona.id} profile image to ${newMediaId}`
            );
          }
        }
      }

      logger.info("Migration completed successfully");
      logger.flush();

      return {
        success: true,
        processedCount,
        errorCount,
        profileUpdateCount,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          totalImagesProcessed: processedCount,
          totalErrors: errorCount,
          totalProfileImagesUpdated: profileUpdateCount,
        },
      };
    } catch (error) {
      logger.error({ error }, "Migration failed with critical error");
      logger.flush();
      throw error;
    }
  },
});
