import { Polar } from "@polar-sh/sdk";
import BuyTokensButton from "./_components/buy-tokens-button";
import { currentUser } from "@clerk/nextjs/server";

export default async function TokensPage() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorised");
  }

  return (
    <div>
      <BuyTokensButton />
    </div>
  );
}
