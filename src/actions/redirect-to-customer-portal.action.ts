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
    server: "sandbox", // Use this option if you're using the sandbox environment - else use 'production' or omit the parameter
  });

  const customerSession = await api.customerSessions.create({
    externalCustomerId: userId,
  });

  redirect(customerSession.customerPortalUrl);
}
