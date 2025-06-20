"use server";

import "server-only";

import { Polar } from "@polar-sh/sdk";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const createCheckoutAction = async () => {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorised");
  }

  const api = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "sandbox", // Use this option if you're using the sandbox environment - else use 'production' or omit the parameter
  });

  const checkout = await api.checkouts.create({
    products: ["2ff15d2a-a75c-48fd-bf7c-26dc3cd7244e"],
    externalCustomerId: user.id,
    // successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tokens`,
  });

  // Redirect to checkout.url
  redirect(checkout.url);
};
