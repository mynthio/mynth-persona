import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { userTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { DAILY_FREE_TOKENS } from "@/lib/constants";
import type { UserBalance } from "@/types/balance.type";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTokenData = await db.query.userTokens.findFirst({
      where: eq(userTokens.userId, userId),
    });

    if (!userTokenData) {
      const response: UserBalance = {
        balance: DAILY_FREE_TOKENS, // All free tokens available
      };

      return NextResponse.json(response);
    }

    const purchasedBalance = userTokenData.balance;
    const dailyTokensUsed = userTokenData.dailyTokensUsed;
    const dailyFreeTokensRemaining = Math.max(
      0,
      DAILY_FREE_TOKENS - dailyTokensUsed
    );

    // Total effective balance = purchased tokens + remaining free tokens
    const totalBalance = purchasedBalance + dailyFreeTokensRemaining;

    const response: UserBalance = {
      balance: totalBalance,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
