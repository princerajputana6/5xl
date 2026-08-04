import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/server/payments/razorpay";
import { markOrderPaid, markOrderFailed } from "@/server/services/order.service";

/**
 * POST /api/payments/webhook — Razorpay server-to-server events.
 *
 * The signature is computed over the *raw* body, so we read text (not JSON)
 * before parsing. Configure the endpoint + secret (RAZORPAY_WEBHOOK_SECRET) in
 * the Razorpay dashboard. Acts as the authoritative fallback if the browser
 * never returns from Checkout.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { order_id?: string; id?: string; method?: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload." }, { status: 400 });
  }

  const entity = event.payload?.payment?.entity;
  const gatewayOrderId = entity?.order_id;

  try {
    if (event.event === "payment.captured" && gatewayOrderId && entity?.id) {
      // Authenticity is already proven by the verified webhook HMAC above.
      await markOrderPaid({
        gatewayOrderId,
        paymentId: entity.id,
        signature: "webhook",
        method: entity.method,
        trusted: true,
      });
    } else if (event.event === "payment.failed" && gatewayOrderId) {
      await markOrderFailed(gatewayOrderId);
    }
  } catch (err) {
    console.error("[webhook] handler error", err);
  }

  // Always 200 so Razorpay stops retrying once received.
  return NextResponse.json({ received: true });
}
