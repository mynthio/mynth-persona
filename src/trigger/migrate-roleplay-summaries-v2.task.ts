import { db } from "@/db/drizzle";
import { personaVersions } from "@/db/schema";
import { task } from "@trigger.dev/sdk";
import { isNotNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  generateRoleplaySummaryV2,
  type RoleplaySummaryV2,
} from "@/services/persona/roleplay-summary.service";
import { updatePersonaVersionRoleplayDataV2 } from "@/services/persona/update-roleplay-data.service";
import type { PersonaData } from "@/types/persona.type";

// Configuration
const BATCH_SIZE = 15;
const MAX_ITERATIONS = 1000;
const MAX_CONSECUTIVE_FAILURES = 10;

// Types
type ProcessResult =
  | { success: true; personaVersionId: string }
  | { success: false; personaVersionId: string; error: string };

/**
 * Safe wrapper for processing individual persona versions.
 * Catches errors and returns a result object to allow batch processing to continue.
 */
async function processPersonaVersionSafe(personaVersion: {
  id: string;
  data: PersonaData;
}): Promise<ProcessResult> {
  try {
    // Generate V2 summary (AI SDK handles retry internally)
    const { summary: summaryV2 } = await generateRoleplaySummaryV2(
      personaVersion.data
    );

    // Update database with V2 data
    await updatePersonaVersionRoleplayDataV2({
      personaVersionId: personaVersion.id,
      summaryV2,
      personaData: personaVersion.data,
    });

    return {
      success: true,
      personaVersionId: personaVersion.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(
      {
        personaVersionId: personaVersion.id,
        error: errorMessage,
      },
      "Failed to migrate persona version"
    );
    return {
      success: false,
      personaVersionId: personaVersion.id,
      error: errorMessage,
    };
  }
}

/**
 * Batch migration task to update all persona versions to V2 roleplay summaries.
 * Processes persona versions in parallel batches with robust error handling.
 */
export const migrateRoleplaySummariesV2Task = task({
  id: "migrate-roleplay-summaries-v2",
  maxDuration: 3600, // 1 hour
  retry: {
    maxAttempts: 1, // No auto-retry for migrations
  },
  run: async () => {
    logger.info("Starting roleplay summaries V2 migration");

    let totalProcessed = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ personaVersionId: string; error: string }> = [];

    let offset = 0;
    let iterations = 0;
    let consecutiveBatchFailures = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        // Safety checks
        iterations++;
        if (iterations > MAX_ITERATIONS) {
          logger.warn("Max iterations reached, stopping");
          break;
        }
        if (consecutiveBatchFailures >= MAX_CONSECUTIVE_FAILURES) {
          logger.error("Too many consecutive batch failures, aborting");
          throw new Error(
            `Aborted after ${MAX_CONSECUTIVE_FAILURES} consecutive batch failures`
          );
        }

        // Fetch batch
        const batch = await db.query.personaVersions.findMany({
          where: isNotNull(personaVersions.roleplayData),
          limit: BATCH_SIZE,
          offset,
          columns: {
            id: true,
            data: true,
          },
        });

        if (batch.length === 0) {
          logger.info("No more persona versions to process");
          hasMore = false;
          break;
        }

        logger.info(
          {
            batch: iterations,
            offset,
            batchSize: batch.length,
            totalProcessed,
          },
          `Processing batch ${offset + 1} to ${offset + batch.length}`
        );

        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map((pv) =>
            processPersonaVersionSafe({
              id: pv.id,
              data: pv.data as PersonaData,
            })
          )
        );

        // Collect results
        let batchSuccessCount = 0;
        let batchErrorCount = 0;

        for (const result of batchResults) {
          if (result.success) {
            batchSuccessCount++;
            successCount++;
          } else {
            batchErrorCount++;
            errorCount++;
            errors.push({
              personaVersionId: result.personaVersionId,
              error: result.error,
            });
          }
        }

        totalProcessed += batch.length;

        // Track consecutive failures
        if (batchSuccessCount === 0) {
          consecutiveBatchFailures++;
          logger.warn(
            { consecutiveBatchFailures },
            "Entire batch failed, no successful migrations"
          );
        } else {
          consecutiveBatchFailures = 0;
        }

        logger.info(
          {
            batchSuccess: batchSuccessCount,
            batchFailed: batchErrorCount,
            totalProcessed,
            successCount,
            errorCount,
            successRate:
              ((successCount / totalProcessed) * 100).toFixed(1) + "%",
          },
          "Batch complete"
        );

        offset += BATCH_SIZE;
      }

      logger.info("Migration completed successfully");
      logger.flush();

      return {
        success: true,
        totalProcessed,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Migration failed with critical error"
      );
      logger.flush();
      throw error;
    }
  },
});
