import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getWishlistProductIds,
  toggleWishlist,
} from "@/server/services/wishlist.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ productIds: [] });
  }
  const productIds = await getWishlistProductIds(session.user.id);
  return NextResponse.json({ productIds });
}

const toggleSchema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }
  const parsed = toggleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }
  const result = await toggleWishlist(session.user.id, parsed.data.productId);
  return NextResponse.json(result);
}
