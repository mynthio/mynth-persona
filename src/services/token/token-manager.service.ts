import { db } from "@/db/drizzle";
import { userTokens } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function refundTokens(
  userId: string,
  tokens: number
): Promise<void> {
  const userLogger = logger.child({ userId });

  try {
    if (tokens > 0) {
      await db
        .update(userTokens)
        .set({ balance: sql`balance + ${tokens}` })
        .where(eq(userTokens.userId, userId));

      userLogger.info({
        event: "token-refund-success",
        component: "services:token:refund",
        attributes: { tokens: { refunded: tokens } },
      });
    }
  } catch (error) {
    userLogger.error({
      event: "token-refund-error",
      component: "services:token:refund",
      error: {
        message: (error as any)?.message ?? String(error),
        name: (error as any)?.name,
      },
    });
  }
}
