import { db } from "@/db/drizzle";
import { userTokens } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

type BurnSparksArgs = {
  userId: string;
  amount: number;
};

type BurnSparksSuccessResult = {
  success: true;

  sparksAfter?: number;
};

type BurnSparksErrorResult = {
  success: false;
  error: string;
};

type BurnSparksResult = BurnSparksSuccessResult | BurnSparksErrorResult;

export const burnSparks = async ({
  userId,
  amount,
}: BurnSparksArgs): Promise<BurnSparksResult> => {
  /**
   * For 0 or negative we don't burn anything
   */
  if (amount <= 0) {
    return {
      success: true,
    };
  }

  const result = await db
    .update(userTokens)
    .set({
      balance: sql`${userTokens.balance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(and(eq(userTokens.userId, userId), gte(userTokens.balance, amount)))
    .returning({
      balance: userTokens.balance,
    });

  if (result.length === 0) {
    return {
      success: false,
      error: "INSUFFICIENT_TOKENS",
    };
  }

  return {
    success: true,
    sparksAfter: result[0].balance,
  };
};
