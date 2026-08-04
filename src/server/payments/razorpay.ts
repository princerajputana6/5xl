import crypto from "node:crypto";
import { env } from "@/env";

/**
 * Payment gateway abstraction over Razorpay.
 *
 * When RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are configured we talk to the real
 * Razorpay REST API. When they are absent we run in a fully self-contained
 * **stub mode**: order creation returns a locally-generated order id and the
 * signature handshake is reproduced with a deterministic local secret. This
 * keeps the entire checkout → pay → verify flow working end-to-end without keys,
 * and swaps to live automatically once the env vars are set — no code changes.
 */

const KEY_ID = env.RAZORPAY_KEY_ID?.trim() || "";
const KEY_SECRET = env.RAZORPAY_KEY_SECRET?.trim() || "";

export const isStub = !KEY_ID || !KEY_SECRET;
export const paymentMode: "live" | "stub" = isStub ? "stub" : "live";

/** Razorpay key id is publishable (safe to expose to the browser). */
export const publicKeyId = isStub ? "rzp_test_stub0000000000" : KEY_ID;

/** Secret used for HMAC signing. In stub mode we derive a stable local secret. */
const SIGNING_SECRET = KEY_SECRET || "5xl_stub_signing_secret";

export type GatewayOrder = {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
};

/** Create an order on the gateway. Amount is in the major unit (INR rupees). */
export async function createGatewayOrder(params: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<GatewayOrder> {
  const amount = Math.round(params.amountInr * 100); // paise
  const currency = "INR";

  if (isStub) {
    return {
      id: `order_stub_${crypto.randomBytes(10).toString("hex")}`,
      amount,
      currency,
      receipt: params.receipt,
    };
  }

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Razorpay order create failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { id: string; amount: number; currency: string };
  return { id: data.id, amount: data.amount, currency: data.currency, receipt: params.receipt };
}

function hmacHex(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Verify the `razorpay_signature` returned by Checkout after a payment. */
export function verifyPaymentSignature(params: {
  gatewayOrderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = hmacHex(
    `${params.gatewayOrderId}|${params.paymentId}`,
    SIGNING_SECRET
  );
  return timingSafeEqual(expected, params.signature);
}

/** Verify a Razorpay webhook body against the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = env.RAZORPAY_WEBHOOK_SECRET?.trim() || SIGNING_SECRET;
  const expected = hmacHex(rawBody, secret);
  return timingSafeEqual(expected, signature);
}

/**
 * Stub-only: simulate what Razorpay Checkout hands back to the client on a
 * successful payment. Produces a payment id and a *valid* signature computed
 * with the local secret, so the normal verify path runs for real.
 */
export function stubAuthorizePayment(gatewayOrderId: string): {
  paymentId: string;
  signature: string;
} {
  if (!isStub) {
    throw new Error("stubAuthorizePayment called while a live gateway is configured");
  }
  const paymentId = `pay_stub_${crypto.randomBytes(10).toString("hex")}`;
  const signature = hmacHex(`${gatewayOrderId}|${paymentId}`, SIGNING_SECRET);
  return { paymentId, signature };
}
