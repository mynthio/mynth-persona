"use server";

import "server-only";

import { auth } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";
import { redirect } from "next/navigation";

export async function redirectToCustomerPortal() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const api = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.VERCEL_ENV === "production" ? "production" : "sandbox",
  });

  const customerSession = await api.customerSessions.create({
    externalCustomerId: userId,
  });

  redirect(customerSession.customerPortalUrl);
}
