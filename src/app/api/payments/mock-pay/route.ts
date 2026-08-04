import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isStub, stubAuthorizePayment } from "@/server/payments/razorpay";

/**
 * POST /api/payments/mock-pay — STUB MODE ONLY.
 *
 * Stands in for the Razorpay Checkout widget: given the gateway order id it
 * returns a payment id and a valid signature, which the client then submits to
 * /api/payments/verify exactly as it would with real Checkout. Returns 404 when
 * a live gateway is configured so it can never run in production.
 */
const schema = z.object({ gatewayOrderId: z.string().min(1) });

export async function POST(req: Request) {
  if (!isStub) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 422 });
  }

  const { paymentId, signature } = stubAuthorizePayment(parsed.data.gatewayOrderId);
  return NextResponse.json({
    razorpay_order_id: parsed.data.gatewayOrderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  });
}
