import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cancelPendingOrder } from "@/server/services/order.service";
import { HttpError } from "@/server/errors";

/** POST /api/orders/[number]/cancel — cancel the user's own unpaid order. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { number } = await params;

  try {
    await cancelPendingOrder(session.user.id, number);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[orders] cancel failed", err);
    return NextResponse.json({ error: "Could not cancel this order." }, { status: 500 });
  }
}
