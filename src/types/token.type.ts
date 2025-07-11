export type TokenDeductionResult =
  | {
      success: true;
      tokensUsed: number;
      tokensFromFree: number;
      tokensFromPurchased: number;
      remainingBalance: number;
      remainingDailyTokens: number;
    }
  | {
      success: false;
      tokensUsed: number;
      remainingBalance: number;
      remainingDailyTokens: number;
      error: string;
    };

export interface UserTokenBalance {
  totalBalance: number;
  purchasedBalance: number;
  dailyFreeTokensRemaining: number;
  dailyTokensUsed: number;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: "spend" | "purchase" | "daily_reset";
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: Date;
}
