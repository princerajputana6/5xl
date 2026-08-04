import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyPaymentSchema } from "@/lib/validators/checkout";
import { markOrderPaid, CheckoutError } from "@/server/services/order.service";

/** POST /api/payments/verify — verify Checkout signature and confirm the order. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const parsed = verifyPaymentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 422 });
  }

  try {
    const order = await markOrderPaid({
      gatewayOrderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
      userId: session.user.id,
    });
    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      status: order.status,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[payments/verify] failed", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
