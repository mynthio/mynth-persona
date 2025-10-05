import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { userTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { transformToPublicUserBalance } from "@/schemas/transformers";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTokenData = await db.query.userTokens.findFirst({
      where: eq(userTokens.userId, userId),
    });

    const response = transformToPublicUserBalance({
      balance: userTokenData?.balance ?? 0,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
