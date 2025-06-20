"use client";

import { createCheckoutAction } from "@/actions/create-checkout.action";
import { Button } from "@heroui/button";

export default function BuyTokensButton() {
  return (
    <Button
      onPress={() => {
        createCheckoutAction();
      }}
    >
      Buy tokens
    </Button>
  );
}
