import { db } from "@/db/drizzle";
import { userTokens, tokenTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DAILY_FREE_TOKENS } from "@/lib/constants";
import { TokenDeductionResult, UserTokenBalance } from "@/types/token.type";
import { logger } from "@/lib/logger";

export async function spendTokens(
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

    // Reset daily tokens if needed (new day)
    const now = new Date();
    const lastReset = currentData.lastDailyReset;
    const shouldResetDaily =
      !lastReset || lastReset.toDateString() !== now.toDateString();

    let dailyTokensUsed = currentData.dailyTokensUsed;
    if (shouldResetDaily) {
      dailyTokensUsed = 0;
    }

    // Calculate available tokens
    const purchasedBalance = currentData.balance;
    const dailyFreeTokensRemaining = Math.max(
      0,
      DAILY_FREE_TOKENS - dailyTokensUsed
    );

    // Determine which source to use (single source only)
    let tokensFromFree = 0;
    let tokensFromPurchased = 0;

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
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userTokens.userId,
        set: {
          balance: newPurchasedBalance,
          dailyTokensUsed: newDailyTokensUsed,
          lastDailyReset: shouldResetDaily ? now : currentData.lastDailyReset,
          totalSpent: newTotalSpent,
          updatedAt: now,
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

export async function refundTokens(
  userId: string,
  tokensFromFree: number,
  tokensFromPurchased: number,
  description?: string
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

      userLogger.info(
        {
          meta: {
            who: "services:token:token-manager:refund-tokens",
            what: "free-tokens-refund-success",
          },
          data: { tokens: { daily: tokensFromFree, balance: 0 } },
        },
        "Free tokens refunded successfully"
      );
    }

    if (tokensFromPurchased > 0) {
      await db
        .update(userTokens)
        .set({
          balance: sql`balance + ${tokensFromPurchased}`,
        })
        .where(eq(userTokens.userId, userId));

      userLogger.info(
        {
          meta: {
            who: "services:token:token-manager:refund-tokens",
            what: "purchased-tokens-refund-success",
          },
          data: { tokens: { daily: 0, balance: tokensFromPurchased } },
        },
        "Purchased tokens refunded successfully"
      );
    }

    if (tokensFromFree > 0 || tokensFromPurchased > 0) {
      userLogger.info(
        {
          meta: {
            who: "services:token:token-manager:refund-tokens",
            what: "token-refund-success",
          },
          data: {
            tokens: { daily: tokensFromFree, balance: tokensFromPurchased },
          },
        },
        "Token refund completed successfully"
      );
    }
  } catch (error) {
    userLogger.error(
      {
        meta: {
          who: "services:token:token-manager:refund-tokens",
          what: "token-refund-error",
        },
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          tokens: { daily: tokensFromFree, balance: tokensFromPurchased },
        },
      },
      "Token refund failed"
    );
    throw error; // Re-throw to maintain existing error handling behavior
  }
}
