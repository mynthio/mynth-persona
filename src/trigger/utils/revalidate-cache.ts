import { logger } from "@/lib/logger";

/**
 * Revalidate a cache tag by calling the internal revalidation Route Handler.
 *
 * This is used by Trigger.dev tasks which cannot call revalidateTag directly
 * since they run outside the Next.js server context.
 *
 * @param tag - The cache tag to revalidate (e.g., `chat:${chatId}`)
 */
export async function revalidateCacheTag(tag: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_URL;
  const secret = process.env.INTERNAL_REVALIDATION_SECRET;

  if (!baseUrl) {
    logger.warn(
      { tag },
      "NEXT_PUBLIC_URL not set, skipping cache revalidation"
    );
    return;
  }

  if (!secret) {
    logger.warn(
      { tag },
      "INTERNAL_REVALIDATION_SECRET not set, skipping cache revalidation"
    );
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/api/internal/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tag }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      logger.error(
        { tag, status: response.status, error: errorBody },
        "Cache revalidation request failed"
      );
      return;
    }

    logger.debug({ tag }, "Cache tag revalidated successfully");
  } catch (error) {
    logger.error(
      { tag, error: error instanceof Error ? error.message : String(error) },
      "Failed to call cache revalidation endpoint"
    );
  }
}
