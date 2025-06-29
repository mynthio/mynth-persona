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
    server: process.env.VERCEL_ENV === "production" ? "production" : "sandbox",
  });

  const checkout = await api.checkouts.create({
    products: [process.env.POLAR_PRODUCT_ID_100_TOKENS!],
    externalCustomerId: user.id,
    successUrl: `${process.env.NEXT_PUBLIC_URL}/tokens`,
  });

  // Redirect to checkout.url
  redirect(checkout.url);
};
