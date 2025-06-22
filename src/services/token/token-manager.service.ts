import { db } from "@/db/drizzle";
import { userTokens, tokenTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DAILY_FREE_TOKENS } from "@/lib/constants";
import { TokenDeductionResult, UserTokenBalance } from "@/types/token.type";

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
    const totalAvailable = purchasedBalance + dailyFreeTokensRemaining;

    // Check if user has enough tokens
    if (totalAvailable < tokensToUse) {
      return {
        success: false,
        tokensUsed: 0,
        remainingBalance: purchasedBalance,
        remainingDailyTokens: dailyFreeTokensRemaining,
        error: `Insufficient tokens. Available: ${totalAvailable}, Required: ${tokensToUse}`,
      };
    }

    // Deduct tokens (prioritize free tokens first, then purchased)
    let tokensFromFree = Math.min(tokensToUse, dailyFreeTokensRemaining);
    let tokensFromPurchased = tokensToUse - tokensFromFree;

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

    // Create transaction record for audit trail
    const transactionId = `tnt_${nanoid()}`;
    await tx.insert(tokenTransactions).values({
      id: transactionId,
      userId,
      type: "spend",
      amount: -tokensToUse, // Negative for spending
      balanceAfter: newPurchasedBalance,
      createdAt: now,
    });

    return {
      success: true,
      tokensUsed: tokensToUse,
      remainingBalance: newPurchasedBalance,
      remainingDailyTokens: Math.max(0, DAILY_FREE_TOKENS - newDailyTokensUsed),
    };
  });
}
