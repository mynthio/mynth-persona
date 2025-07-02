// api/webhook/polar/route.ts
import { db } from "@/db/drizzle";
import { tokenTransactions, userTokens } from "@/db/schema";
import { logger } from "@/lib/logger";
import logsnag from "@/lib/logsnag";
import { Webhooks } from "@polar-sh/nextjs";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const PRODUCT_ID_TO_TOKEN_AMOUNT: Record<string, number> = {
  [process.env.POLAR_PRODUCT_ID_100_TOKENS!]: 100,
};

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    logger.debug(payload, "Polar Webhook Received");
  },
  onOrderPaid: async (payload) => {
    logger.debug(payload, "Polar Order Paid");

    const productId = payload.data.product.id;
    const userId = payload.data.customer.externalId;
    const orderId = payload.data.id;
    const checkoutId = payload.data.checkoutId;

    if (!userId) {
      logger.error({ payload }, "User ID not found");
      return;
    }

    const tokenAmount = PRODUCT_ID_TO_TOKEN_AMOUNT[productId];

    if (!tokenAmount) {
      logger.error({ productId }, "Unknown product ID");
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(userTokens)
        .values({
          userId,
          balance: tokenAmount,
          totalPurchased: tokenAmount,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userTokens.userId,
          set: {
            balance: sql`${userTokens.balance} + ${tokenAmount}`,
            totalPurchased: sql`${userTokens.totalPurchased} + ${tokenAmount}`,
            updatedAt: new Date(),
          },
        });

      await tx.insert(tokenTransactions).values({
        userId,
        amount: tokenAmount,
        balanceAfter: 0,
        id: `tnt_${nanoid()}`,
        type: "purchase",
        orderId,
        checkoutId,
        createdAt: new Date(),
      });
    });

    await logsnag.insight.track({
      title: "Tokens Purchased",
      value: tokenAmount,
      icon: "💰",
    });
  },
});
