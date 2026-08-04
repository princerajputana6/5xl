import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserOrders } from "@/server/services/order.service";

/** GET /api/orders — the signed-in user's orders, newest first. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ orders: [] }, { status: 401 });
  }
  const orders = await getUserOrders(session.user.id);
  return NextResponse.json({ orders });
}
