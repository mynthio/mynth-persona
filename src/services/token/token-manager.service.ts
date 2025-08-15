import { db } from "@/db/drizzle";
import { userTokens } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { DAILY_FREE_TOKENS } from "@/lib/constants";
import { TokenDeductionResult } from "@/types/token.type";
import { logger } from "@/lib/logger";
import {
  calculateDailyFreeTokensRemaining,
  getCurrentUTCTime,
} from "@/lib/date-utils";

export async function spendTokens(
  userId: string,
  tokensToUse: number
): Promise<TokenDeductionResult> {
  if (tokensToUse <= 0) {
    return {
      success: false,
      tokensUsed: 0,
      remainingBalance: 0,
      remainingDailyTokens: 0,
      error: "Token amount must be greater than 0",
    };
  }

  return await db.transaction(async (tx) => {
    // Get user token record (if exists)
    const userTokenData = await tx.query.userTokens.findFirst({
      where: eq(userTokens.userId, userId),
    });

    // Use defaults if user doesn't exist yet
    const currentData = userTokenData || {
      userId,
      balance: 0,
      dailyTokensUsed: 0,
      lastDailyReset: null,
      totalPurchased: 0,
      totalSpent: 0,
      updatedAt: new Date(),
    };

    // Reset daily tokens if needed (new UTC day)
    const now = getCurrentUTCTime();
    const {
      remainingTokens: dailyFreeTokensRemaining,
      shouldReset: shouldResetDaily,
      effectiveTokensUsed: dailyTokensUsed,
    } = calculateDailyFreeTokensRemaining(
      currentData.dailyTokensUsed,
      currentData.lastDailyReset,
      DAILY_FREE_TOKENS
    );

    // Determine which source to use (single source only)
    let tokensFromFree = 0;
    let tokensFromPurchased = 0;

    const purchasedBalance = currentData.balance;

    if (dailyFreeTokensRemaining >= tokensToUse) {
      // Use daily free tokens only
      tokensFromFree = tokensToUse;
    } else if (purchasedBalance >= tokensToUse) {
      // Use purchased tokens only
      tokensFromPurchased = tokensToUse;
    } else {
      // Not enough tokens in either source
      return {
        success: false,
        tokensUsed: 0,
        remainingBalance: purchasedBalance,
        remainingDailyTokens: dailyFreeTokensRemaining,
        error: `Insufficient tokens. Daily free tokens: ${dailyFreeTokensRemaining}, Purchased balance: ${purchasedBalance}, Required: ${tokensToUse}`,
      };
    }

    const newDailyTokensUsed = dailyTokensUsed + tokensFromFree;
    const newPurchasedBalance = purchasedBalance - tokensFromPurchased;
    const newTotalSpent = currentData.totalSpent + tokensToUse;

    // Upsert user tokens (insert if new user, update if existing)
    await tx
      .insert(userTokens)
      .values({
        userId,
        balance: newPurchasedBalance,
        dailyTokensUsed: newDailyTokensUsed,
        lastDailyReset: shouldResetDaily ? now : currentData.lastDailyReset,
        totalPurchased: currentData.totalPurchased,
        totalSpent: newTotalSpent,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userTokens.userId,
        set: {
          balance: newPurchasedBalance,
          dailyTokensUsed: newDailyTokensUsed,
          lastDailyReset: shouldResetDaily ? now : currentData.lastDailyReset,
          totalSpent: newTotalSpent,
          updatedAt: new Date(),
        },
      });

    return {
      success: true,
      tokensUsed: tokensToUse,
      tokensFromFree,
      tokensFromPurchased,
      remainingBalance: newPurchasedBalance,
      remainingDailyTokens: Math.max(0, DAILY_FREE_TOKENS - newDailyTokensUsed),
    };
  });
}

/**
 * Spend only purchased tokens (no free tokens allowed)
 * This is used for premium features like high-quality image generation
 */
export async function spendPurchasedTokensOnly(
  userId: string,
  tokensToUse: number,
  description?: string
): Promise<TokenDeductionResult> {
  if (tokensToUse <= 0) {
    return {
      success: false,
      tokensUsed: 0,
      remainingBalance: 0,
      remainingDailyTokens: 0,
      error: "Token amount must be greater than 0",
    };
  }

  return await db.transaction(async (tx) => {
    // Get user token record (if exists)
    const userTokenData = await tx.query.userTokens.findFirst({
      where: eq(userTokens.userId, userId),
    });

    // Use defaults if user doesn't exist yet
    const currentData = userTokenData || {
      userId,
      balance: 0,
      dailyTokensUsed: 0,
      lastDailyReset: null,
      totalPurchased: 0,
      totalSpent: 0,
      updatedAt: new Date(),
    };

    // Reset daily tokens if needed (new UTC day)
    const now = getCurrentUTCTime();
    const {
      remainingTokens: dailyFreeTokensRemaining,
      shouldReset: shouldResetDaily,
      effectiveTokensUsed: dailyTokensUsed,
    } = calculateDailyFreeTokensRemaining(
      currentData.dailyTokensUsed,
      currentData.lastDailyReset,
      DAILY_FREE_TOKENS
    );

    // Only use purchased tokens
    const purchasedBalance = currentData.balance;
    if (purchasedBalance < tokensToUse) {
      return {
        success: false,
        tokensUsed: 0,
        remainingBalance: purchasedBalance,
        remainingDailyTokens: dailyFreeTokensRemaining,
        error: `Insufficient purchased tokens. This feature requires purchased tokens only. Available: ${purchasedBalance}, Required: ${tokensToUse}`,
      };
    }

    const tokensFromFree = 0;
    const tokensFromPurchased = tokensToUse;
    const newPurchasedBalance = purchasedBalance - tokensFromPurchased;
    const newTotalSpent = currentData.totalSpent + tokensToUse;

    // Upsert user tokens (insert if new user, update if existing)
    await tx
      .insert(userTokens)
      .values({
        userId,
        balance: newPurchasedBalance,
        dailyTokensUsed: dailyTokensUsed, // No change to daily tokens
        lastDailyReset: shouldResetDaily ? now : currentData.lastDailyReset,
        totalPurchased: currentData.totalPurchased,
        totalSpent: newTotalSpent,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userTokens.userId,
        set: {
          balance: newPurchasedBalance,
          dailyTokensUsed: dailyTokensUsed, // No change to daily tokens
          lastDailyReset: shouldResetDaily ? now : currentData.lastDailyReset,
          totalSpent: newTotalSpent,
          updatedAt: new Date(),
        },
      });

    return {
      success: true,
      tokensUsed: tokensToUse,
      tokensFromFree,
      tokensFromPurchased,
      remainingBalance: newPurchasedBalance,
      remainingDailyTokens: Math.max(0, DAILY_FREE_TOKENS - dailyTokensUsed),
    };
  });
}

export async function refundTokens(
  userId: string,
  tokensFromFree: number,
  tokensFromPurchased: number
): Promise<void> {
  const userLogger = logger.child({ userId });

  try {
    if (tokensFromFree > 0) {
      await db
        .update(userTokens)
        .set({
          dailyTokensUsed: sql`daily_tokens_used - ${tokensFromFree}`,
        })
        .where(eq(userTokens.userId, userId));

      userLogger.info({
        event: "token-refund-success",
        component: "services:token:refund",
        attributes: { tokens: { daily: tokensFromFree, balance: 0 } },
      });
    }

    if (tokensFromPurchased > 0) {
      await db
        .update(userTokens)
        .set({
          balance: sql`balance + ${tokensFromPurchased}`,
        })
        .where(eq(userTokens.userId, userId));

      userLogger.info({
        event: "token-refund-success",
        component: "services:token:refund",
        attributes: { tokens: { daily: 0, balance: tokensFromPurchased } },
      });
    }
  } catch (error) {
    userLogger.error({
      event: "token-refund-error",
      component: "services:token:refund",
      attributes: { error: (error as Error).message },
    });

    throw error;
  }
}
