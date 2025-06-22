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
    products: ["401f6067-e6aa-4ce9-ba34-b406b6aa9ce4"],
    externalCustomerId: user.id,
    // successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tokens`,
  });

  // Redirect to checkout.url
  redirect(checkout.url);
};
