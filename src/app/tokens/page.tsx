import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { userTokens, tokenTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DAILY_FREE_TOKENS } from "@/lib/constants";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { createCheckoutAction } from "@/actions/create-checkout.action";
import { redirectToCustomerPortal } from "@/actions/redirect-to-customer-portal.action";
import TransactionHistory from "./_components/transaction-history";

async function getTokenData(userId: string) {
  const userTokenData = await db.query.userTokens.findFirst({
    where: eq(userTokens.userId, userId),
  });

  // Get token transactions for history
  const transactions = await db.query.tokenTransactions.findMany({
    where: eq(tokenTransactions.userId, userId),
    orderBy: [desc(tokenTransactions.createdAt)],
    limit: 10,
  });

  if (!userTokenData) {
    return {
      purchasedBalance: 0,
      dailyTokensUsed: 0,
      dailyFreeTokensRemaining: DAILY_FREE_TOKENS,
      totalBalance: DAILY_FREE_TOKENS,
      totalPurchased: 0,
      totalSpent: 0,
      transactions,
    };
  }

  const dailyTokensUsed = userTokenData.dailyTokensUsed;
  const dailyFreeTokensRemaining = Math.max(
    0,
    DAILY_FREE_TOKENS - dailyTokensUsed
  );
  const totalBalance = userTokenData.balance + dailyFreeTokensRemaining;

  return {
    purchasedBalance: userTokenData.balance,
    dailyTokensUsed,
    dailyFreeTokensRemaining,
    totalBalance,
    totalPurchased: userTokenData.totalPurchased,
    totalSpent: userTokenData.totalSpent,
    transactions,
  };
}

function TokenBalanceCard({ tokenData }: { tokenData: any }) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold">Token Balance</h2>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg">Total Available Tokens</span>
            <Chip
              size="lg"
              color="primary"
              variant="flat"
              className="text-lg font-bold"
            >
              {tokenData.totalBalance}
            </Chip>
          </div>

          <Divider />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Purchased Tokens</span>
              <span className="font-medium">{tokenData.purchasedBalance}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Free Tokens Today</span>
              <span className="font-medium">
                {tokenData.dailyFreeTokensRemaining}
              </span>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 You receive {DAILY_FREE_TOKENS} free tokens daily that don't
                stack. Use them or lose them!
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function PurchaseCard() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold">Purchase Tokens</h2>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">100 Tokens</span>
              <Chip color="secondary" variant="flat">
                Best Value
              </Chip>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Perfect for creating multiple personas and generating images
            </p>
            <form action={createCheckoutAction}>
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full"
              >
                Buy 100 Tokens
              </Button>
            </form>
          </div>

          <Divider />

          <div>
            <p className="text-sm text-gray-600 mb-3">
              Need to manage your payment details?
            </p>
            <form action={redirectToCustomerPortal}>
              <Button
                type="submit"
                variant="bordered"
                size="md"
                className="w-full"
              >
                Manage Payment Settings
              </Button>
            </form>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function StatsCard({ tokenData }: { tokenData: any }) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold">Usage Statistics</h2>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {tokenData.totalPurchased}
            </div>
            <div className="text-sm text-green-800">Total Purchased</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {tokenData.totalSpent}
            </div>
            <div className="text-sm text-red-800">Total Spent</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default async function TokensPage() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorised");
  }

  const tokenData = await getTokenData(user.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Tokens</h1>
        <p className="text-gray-600">
          Manage your token balance and view transaction history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Balance and Purchase */}
        <div className="lg:col-span-1 space-y-6">
          <TokenBalanceCard tokenData={tokenData} />
          <PurchaseCard />
          <StatsCard tokenData={tokenData} />
        </div>

        {/* Right Column - Transaction History */}
        <div className="lg:col-span-2">
          <TransactionHistory transactions={tokenData.transactions} />
        </div>
      </div>
    </div>
  );
}
