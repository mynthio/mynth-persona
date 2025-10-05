"use server";

import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { createInvoice } from "@/lib/nowpayments";
import { resolveSparkCheckout } from "@/config/shared/sparks";
import { db } from "@/db/drizzle";
import { tokenTransactions } from "@/db/schema";

export const createCheckoutAction = async (formData: FormData) => {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorised");
  }

  const orderId = `ttx_${nanoid()}`;

  // Only allow preset packs; reject custom amounts
  const presetKeyRaw = formData.get("preset");
  if (typeof presetKeyRaw !== "string" || presetKeyRaw.length === 0) {
    return redirect("/sparks?status=invalid");
  }

  let checkout;
  try {
    checkout = resolveSparkCheckout(presetKeyRaw);
  } catch (err) {
    return redirect("/sparks?status=invalid");
  }

  await db.insert(tokenTransactions).values({
    id: orderId,
    userId: user.id,
    amount: checkout.amount,
    balanceAfter: 0,
    type: "purchase",
    status: "pending",
  });

  const successUrl = `${process.env.NEXT_PUBLIC_URL}/sparks?status=success`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_URL}/sparks?status=cancel`;
  const ipnUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhook/ipn`;

  // Create a NOWPayments sandbox invoice to preserve redirect behavior
  const invoice = await createInvoice({
    price_amount: checkout.priceUSD,
    price_currency: "usd",
    order_id: orderId,
    order_description: checkout.description,
    success_url: successUrl,
    cancel_url: cancelUrl,
    ipn_callback_url: ipnUrl,
  });

  redirect(invoice.invoice_url);
};
