export type TokenDeductionResult =
  | {
      success: true;
      tokensUsed: number;
      remainingBalance: number;
    }
  | {
      success: false;
      tokensUsed: number;
      remainingBalance: number;
      error: string;
    };

export interface UserTokenBalance {
  balance: number;
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
