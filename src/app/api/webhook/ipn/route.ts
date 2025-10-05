import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import { db } from "@/db/drizzle";
import { tokenTransactions, userTokens } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

function sortObject(obj: any) {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] =
        obj[key] && typeof obj[key] === "object"
          ? sortObject(obj[key])
          : obj[key];
      return result;
    }, {} as any);
}

export async function POST(req: NextRequest) {
  const requestId =
    req.headers.get("x-request-id") ||
    req.headers.get("x-vercel-id") ||
    undefined;

  try {
    const secret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (!secret) {
      logger.error(
        {
          event: "webhook-error",
          component: "webhook:nowpayments:ipn",
          request_id: requestId,
          attributes: {
            path: req.nextUrl.pathname,
            method: req.method,
          },
          error: {
            name: "ConfigError",
            message: "NOWPAYMENTS_IPN_SECRET missing",
          },
        },
        "NOWPayments IPN secret is not configured"
      );
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const receivedSig = req.headers.get("x-nowpayments-sig");
    if (!receivedSig) {
      logger.error(
        {
          event: "webhook-error",
          component: "webhook:nowpayments:ipn",
          request_id: requestId,
          attributes: {
            path: req.nextUrl.pathname,
            method: req.method,
          },
          error: { name: "AuthError", message: "No HMAC signature sent" },
        },
        "NOWPayments IPN signature header missing"
      );
      return NextResponse.json(
        { error: "No HMAC signature sent" },
        { status: 400 }
      );
    }

    const payload = await req.json();

    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(JSON.stringify(sortObject(payload)));
    const signature = hmac.digest("hex");

    if (signature !== receivedSig) {
      logger.error(
        {
          event: "webhook-error",
          component: "webhook:nowpayments:ipn",
          request_id: requestId,
          attributes: {
            path: req.nextUrl.pathname,
            method: req.method,
          },
          error: {
            name: "AuthError",
            message: "HMAC signature does not match",
          },
          payload,
        },
        "NOWPayments IPN signature mismatch"
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Valid signature: log the payload as requested
    logger.info(
      {
        event: "nowpayments_ipn_received",
        component: "webhook:nowpayments:ipn",
        request_id: requestId,
        attributes: {
          path: req.nextUrl.pathname,
          method: req.method,
        },
        payload,
      },
      "NOWPayments IPN payload received"
    );

    const orderId = payload.order_id;
    const ipnStatusToInternalStatus = {
      waiting: "pending",
      confirming: "pending",
      confirmed: "pending",
      finished: "completed",
      sending: "pending",
      partially_paid: "pending",
      failed: "failed",
      expired: "expired",
    } as const;

    const internalStatus =
      ipnStatusToInternalStatus[
        payload.payment_status as keyof typeof ipnStatusToInternalStatus
      ];

    if (!internalStatus) {
      logger.error({
        event: "webhook-error",
        component: "webhook:nowpayments:ipn",
        request_id: requestId,
        attributes: {
          path: req.nextUrl.pathname,
          method: req.method,
        },
        error: {
          name: "InvalidStatusMapping",
          message: `Invalid payment status mapping for order ID ${orderId}`,
        },
      });
    }

    await db.transaction(async (tx) => {
      const transactionData = await tx.query.tokenTransactions.findFirst({
        where: (tokenTransactions, { eq }) => eq(tokenTransactions.id, orderId),
      });

      if (!transactionData) {
        logger.error(
          {
            event: "webhook-error",
            component: "webhook:nowpayments:ipn",
            request_id: requestId,
            attributes: {
              path: req.nextUrl.pathname,
              method: req.method,
            },
            error: {
              name: "NotFoundError",
              message: `Transaction with ID ${orderId} not found`,
            },
            payload,
          },
          "NOWPayments IPN transaction not found"
        );

        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }

      await tx
        .update(tokenTransactions)
        .set({
          status: internalStatus,
          updatedAt: new Date(),
        })
        .where(eq(tokenTransactions.id, orderId));

      if (
        internalStatus === "completed" &&
        transactionData.status === "pending"
      ) {
        const [{ newBalance }] = await tx
          .insert(userTokens)
          .values({
            userId: transactionData.userId,
            balance: transactionData.amount,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userTokens.userId,
            set: {
              balance: sql`${userTokens.balance} + ${transactionData.amount}`,
              updatedAt: new Date(),
            },
          })
          .returning({ newBalance: userTokens.balance });

        await tx
          .update(tokenTransactions)
          .set({
            balanceAfter: newBalance,
          })
          .where(eq(tokenTransactions.id, orderId));
      }
    });

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (err) {
    const normalizedError =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : { name: "UnknownError", message: String(err) };

    logger.error(
      {
        event: "webhook-error",
        component: "webhook:nowpayments:ipn",
        request_id: requestId,
        attributes: {
          path: req.nextUrl.pathname,
          method: req.method,
        },
        error: normalizedError,
      },
      "NOWPayments IPN handling failed"
    );

    return NextResponse.json(
      { error: "Error handling webhook" },
      { status: 400 }
    );
  }
}
