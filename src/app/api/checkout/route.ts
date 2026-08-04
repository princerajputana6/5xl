import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkoutSchema } from "@/lib/validators/checkout";
import { createOrderFromCart } from "@/server/services/order.service";
import { saveAddress } from "@/server/services/address.service";
import { HttpError } from "@/server/errors";

/** POST /api/checkout — create an order and open a payment session. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to checkout." }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 }
    );
  }

  try {
    const { session: checkout } = await createOrderFromCart(
      session.user.id,
      parsed.data
    );

    if (parsed.data.saveAddress) {
      await saveAddress(session.user.id, parsed.data.address).catch(() => {});
    }

    return NextResponse.json(checkout);
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[checkout] failed", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
