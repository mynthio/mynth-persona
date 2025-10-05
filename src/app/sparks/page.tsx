import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { userTokens, tokenTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { FlameIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SparksPresets } from "./_components/sparks-presets";

export default async function SparksPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  // Get user token data and recent transactions
  const [userTokenData, recentTransactions] = await Promise.all([
    db.query.userTokens.findFirst({
      where: eq(userTokens.userId, userId),
    }),
    db.query.tokenTransactions.findMany({
      where: eq(tokenTransactions.userId, userId),
      orderBy: [desc(tokenTransactions.createdAt)],
      limit: 10,
    }),
  ]);

  // Calculate balances
  const purchasedBalance = userTokenData?.balance || 0;
  const totalBalance = purchasedBalance;
  const totalSpent = userTokenData?.totalSpent || 0;
  const totalPurchased = userTokenData?.totalPurchased || 0;

  // Filter purchase transactions for purchase history
  const purchaseTransactions = recentTransactions.filter(
    (transaction) => transaction.type === "purchase"
  );

  return (
    <>
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
        <div className="z-10 flex flex-col items-center justify-center px-[12px]">
          <div>
            <FlameIcon
              weight="duotone"
              size={64}
              className="text-rose-600 animate-pulse"
            />
          </div>
          <strong className="block -mt-[28px] text-[6rem] font-[100] font-onest">
            {totalBalance}
          </strong>
          <p className="font-onest uppercase -mt-[24px] text-[1.3rem] font-[300] text-surface-foreground/80">
            Sparks
          </p>

          <div className="mt-[32px]">
            <SparksPresets />
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              New to crypto?{" "}
              <Link href="/help/crypto" className="underline text-primary">
                Read how to pay with crypto
              </Link>
              .
            </p>
          </div>
        </div>

        <StarsBackground
          className="z-3 bg-surface absolute left-0 top-0 bottom-0 right-0 w-full h-full rounded-[18px]"
          starColor="#070708"
        />
      </div>
    </>
  );
}
