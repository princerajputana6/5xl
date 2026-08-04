import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addressSchema } from "@/lib/validators/checkout";
import { getUserAddresses, saveAddress } from "@/server/services/address.service";

/** GET /api/addresses — saved addresses for the signed-in user. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ addresses: [] }, { status: 401 });
  }
  const addresses = await getUserAddresses(session.user.id);
  return NextResponse.json({ addresses });
}

/** POST /api/addresses — save a new address. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const parsed = addressSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid address." },
      { status: 422 }
    );
  }
  const address = await saveAddress(session.user.id, parsed.data);
  return NextResponse.json({ address });
}
