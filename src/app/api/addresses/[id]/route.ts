import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addressSchema } from "@/lib/validators/checkout";
import {
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/server/services/address.service";
import { HttpError } from "@/server/errors";

async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

function fail(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[addresses] request failed", err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

/** PATCH /api/addresses/[id] — edit an address, or make it the default. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    // A bare { makeDefault: true } only flips the flag; anything else is an edit.
    if (body?.makeDefault === true && Object.keys(body).length === 1) {
      await setDefaultAddress(userId, id);
      return NextResponse.json({ ok: true });
    }

    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid address." },
        { status: 422 }
      );
    }

    const address = await updateAddress(userId, id, parsed.data);
    return NextResponse.json({ address });
  } catch (err) {
    return fail(err);
  }
}

/** DELETE /api/addresses/[id] — remove a saved address. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { id } = await params;
  try {
    await deleteAddress(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
