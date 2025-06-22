"use client";

import { createCheckoutAction } from "@/actions/create-checkout.action";
import { redirectToCustomerPortal } from "@/actions/redirect-to-customer-portal.action";
import { Button } from "@heroui/button";

export default function BuyTokensButton() {
  return (
    <>
      <Button
        onPress={() => {
          createCheckoutAction();
        }}
      >
        Buy tokens
      </Button>
      <Button
        onPress={() => {
          redirectToCustomerPortal();
        }}
      >
        Manage payment details
      </Button>
    </>
  );
}
