import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { subscriptionActionSchema } from "@/lib/validators/subscription";
import { updateSubscriptionStatus } from "@/server/services/subscription.service";
import { HttpError } from "@/server/errors";

/** PATCH /api/subscriptions/[id] — pause / resume / cancel (owner only). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = subscriptionActionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 422 });
  }

  try {
    await updateSubscriptionStatus(session.user.id, id, parsed.data.action);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[subscriptions] update failed", err);
    return NextResponse.json({ error: "Could not update subscription." }, { status: 500 });
  }
}
