import "server-only";

type CreateInvoiceParams = {
  price_amount: number; // fiat amount
  price_currency: string; // e.g., 'usd'
  pay_currency?: string; // e.g., 'btc' (optional)
  order_id?: string;
  order_description?: string;
  success_url?: string;
  cancel_url?: string;
  ipn_callback_url?: string;
  case?: string; // sandbox-only
};

export type CreateInvoiceResponse = {
  id: string;
  invoice_url: string;
};

const BASE_URL =
  process.env.VERCEL_ENV === "production"
    ? "https://api.nowpayments.io"
    : "https://api-sandbox.nowpayments.io";

export async function createInvoice(params: CreateInvoiceParams) {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("NOWPAYMENTS_API_KEY is not configured");
  }

  const res = await fetch(`${BASE_URL}/v1/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NOWPayments invoice create failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as CreateInvoiceResponse;
  if (!data?.invoice_url) {
    throw new Error("NOWPayments did not return invoice_url");
  }

  return data;
}
