import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { userTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { DAILY_FREE_TOKENS } from "@/lib/constants";
import { transformToPublicUserBalance } from "@/schemas/transformers";
import { calculateDailyFreeTokensRemaining } from "@/lib/date-utils";

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
      const response = transformToPublicUserBalance({
        purchasedBalance: 0,
        dailyFreeTokensRemaining: DAILY_FREE_TOKENS,
        dailyTokensUsed: 0,
      });
      return NextResponse.json(response);
    }

    const purchasedBalance = userTokenData.balance;

    const {
      remainingTokens: dailyFreeTokensRemaining,
      effectiveTokensUsed: dailyTokensUsed,
    } = calculateDailyFreeTokensRemaining(
      userTokenData.dailyTokensUsed,
      userTokenData.lastDailyReset,
      DAILY_FREE_TOKENS
    );

    const response = transformToPublicUserBalance({
      purchasedBalance,
      dailyFreeTokensRemaining,
      dailyTokensUsed,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
