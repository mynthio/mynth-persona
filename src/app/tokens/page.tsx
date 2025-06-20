import { Polar } from "@polar-sh/sdk";
import BuyTokensButton from "./_components/buy-tokens-button";
import { currentUser } from "@clerk/nextjs/server";

export default async function TokensPage() {
  const METER_ID = "2d48098d-c2e4-4f19-b02e-45118e477d32";

  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorised");
  }

  const api = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "sandbox",
  });

  console.time("get meter");
  const meter = await api.customerMeters.get({
    id: METER_ID,
  });
  console.timeEnd("get meter");

  console.time("list meters");
  const meters = await api.customerMeters.list({
    externalCustomerId: user.id,
  });
  console.timeEnd("list meters");

  const tokensMeter = meters.result.items.find(
    (meter) => meter.meterId === "923eda4d-e7aa-46a9-9964-7145c5bae8e1"
  );

  return (
    <div>
      Buy tokens
      <BuyTokensButton />
      <div>You have: {tokensMeter?.balance} tokens left</div>
      <hr />
      <code>
        <pre>{JSON.stringify(meter, null, 2)}</pre>
      </code>
      <hr />
      <code>
        <pre>{JSON.stringify(meters, null, 2)}</pre>
      </code>
    </div>
  );
}
