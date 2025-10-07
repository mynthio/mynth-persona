import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { userTokens, tokenTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import {
  FlameIcon,
  CheckCircleIcon,
  DiscordLogo,
  InfoIcon,
  DiscordLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SparksPresets } from "./_components/sparks-presets";
import { DISCORD_INVITE_URL } from "@/lib/constants";

export default async function SparksPage({
  searchParams,
}: PageProps<"/sparks">) {
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

  const sp = await searchParams;
  const statusParam = Array.isArray(sp?.status) ? sp?.status[0] : sp?.status;
  const showSuccessBanner = statusParam === "success";

  return (
    <>
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center py-[48px]">
        <div className="z-10 flex flex-col items-center justify-center px-[12px]">
          {showSuccessBanner && (
            <div className="w-full max-w-[640px] mb-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-900">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon
                    size={18}
                    weight="duotone"
                    className="mt-0.5"
                  />
                  <div className="space-y-1 text-[12px] leading-relaxed">
                    <p className="text-[13px] font-medium">
                      Transaction successful — your Sparks are being processed
                    </p>
                    <p>
                      Your payment was received. Funds are processing and may
                      take a few minutes to confirm on-chain. Your balance will
                      update automatically once confirmed.
                    </p>
                    <p>
                      Need help? Email{" "}
                      <a href="mailto:hi@prsna.app" className="underline">
                        hi@prsna.app
                      </a>{" "}
                      or join our {""}
                      <a
                        href={DISCORD_INVITE_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Discord
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          {/* Discord promo: 100 free Sparks */}
          <div className="w-full max-w-[640px] mt-[48px]">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900">
              <div className="flex items-start gap-2">
                <DiscordLogoIcon
                  size={18}
                  weight="duotone"
                  className="mt-0.5 shrink-0"
                />
                <div className="space-y-1 text-[12px] leading-relaxed">
                  <p className="text-[13px] font-medium">Get 100 Sparks free</p>
                  <p>
                    Join our {""}
                    <a
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Discord
                    </a>{" "}
                    and DM <span className="font-medium">@50bytesofjohn</span>{" "}
                    with the email you use here. We’ll credit
                    <span className="font-medium"> 100 Sparks</span> to your
                    account.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Early community rewards note */}
          <div className="w-full max-w-[640px] mt-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <div className="flex items-start gap-2">
                <InfoIcon
                  size={18}
                  weight="duotone"
                  className="mt-0.5 shrink-0"
                />
                <div className="space-y-1 text-[12px] leading-relaxed">
                  <p className="text-[13px] font-medium">
                    Help early, earn Sparks
                  </p>
                  <p>
                    It’s early days — helpful activity like feedback, bug
                    reports, or community help may be rewarded with free Sparks.
                    Share ideas or issues in Discord and we’ll follow up.
                  </p>
                </div>
              </div>
            </div>
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
