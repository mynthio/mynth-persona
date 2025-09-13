import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { userTokens, tokenTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DAILY_FREE_TOKENS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createCheckoutAction } from "@/actions/create-checkout.action";
import { redirectToCustomerPortal } from "@/actions/redirect-to-customer-portal.action";
import { calculateDailyFreeTokensRemaining } from "@/lib/date-utils";

export default async function TokensPage() {
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
  const dailyTokensUsedRaw = userTokenData?.dailyTokensUsed || 0;
  const lastDailyReset = userTokenData?.lastDailyReset || null;
  const {
    remainingTokens: dailyFreeTokensRemaining,
    effectiveTokensUsed: dailyTokensUsed,
  } = calculateDailyFreeTokensRemaining(
    dailyTokensUsedRaw,
    lastDailyReset,
    DAILY_FREE_TOKENS
  );
  const totalBalance = purchasedBalance + dailyFreeTokensRemaining;
  const totalSpent = userTokenData?.totalSpent || 0;
  const totalPurchased = userTokenData?.totalPurchased || 0;

  // Filter purchase transactions for purchase history
  const purchaseTransactions = recentTransactions.filter(
    (transaction) => transaction.type === "purchase"
  );

  return (
    <>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-foreground mb-3">
            Token Balance
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Manage your tokens and view transaction history
          </p>
        </div>

        {/* Balance Overview */}
        <div className="grid gap-6 md:gap-8 mb-12">
          {/* Current Balance */}
          <Card className="p-8 text-center border border-border">
            <div className="mb-6">
              <div className="text-6xl font-light text-foreground mb-2">
                {totalBalance}
              </div>
              <div className="text-muted-foreground text-lg">
                Total Available Tokens
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">
                  {purchasedBalance}
                </span>{" "}
                purchased
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">
                  {dailyFreeTokensRemaining}
                </span>{" "}
                daily free
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <form action={createCheckoutAction}>
                <Button
                  type="submit"
                  className="px-8 py-6 text-base font-medium"
                  size="lg"
                >
                  Buy 100 Tokens
                </Button>
              </form>

              <form action={redirectToCustomerPortal}>
                <Button
                  type="submit"
                  variant="outline"
                  className="px-8 py-6 text-base font-medium"
                  size="lg"
                >
                  Manage Payments
                </Button>
              </form>
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6 text-center border border-border">
              <div className="text-3xl font-light text-foreground mb-2">
                {totalPurchased}
              </div>
              <div className="text-muted-foreground text-sm">
                Total Purchased
              </div>
            </Card>

            <Card className="p-6 text-center border border-border">
              <div className="text-3xl font-light text-foreground mb-2">
                {totalSpent}
              </div>
              <div className="text-muted-foreground text-sm">Total Spent</div>
            </Card>
          </div>
        </div>

        {/* Purchase History */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-light text-foreground">
              Purchase History
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Recent token purchases • For detailed history, use "Manage
              Payments"
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="font-medium text-foreground py-4 px-6">
                  Date
                </TableHead>
                <TableHead className="font-medium text-foreground py-4 px-6">
                  Type
                </TableHead>
                <TableHead className="font-medium text-foreground py-4 px-6 text-right">
                  Amount
                </TableHead>
                <TableHead className="font-medium text-foreground py-4 px-6 text-right">
                  Balance After
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No purchases yet. Your purchase history will appear here.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="border-b border-border/50"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="text-sm text-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge variant="secondary" className="text-xs">
                        Purchase
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <span className="text-green-600 font-medium">
                        +{transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <span className="text-foreground font-medium">
                        {transaction.balanceAfter}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Daily Reset Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Free tokens reset daily at midnight UTC and don't accumulate
          </p>
        </div>
      </div>
    </>
  );
}
