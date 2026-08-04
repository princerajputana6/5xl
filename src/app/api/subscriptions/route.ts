import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { subscribeSchema } from "@/lib/validators/subscription";
import { createSubscription } from "@/server/services/subscription.service";
import { HttpError } from "@/server/errors";

/** POST /api/subscriptions — subscribe to a product. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to subscribe." }, { status: 401 });
  }

  const parsed = subscribeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 }
    );
  }

  try {
    const sub = await createSubscription(session.user.id, parsed.data);
    return NextResponse.json({ subscription: sub });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[subscriptions] create failed", err);
    return NextResponse.json({ error: "Could not create subscription." }, { status: 500 });
  }
}
