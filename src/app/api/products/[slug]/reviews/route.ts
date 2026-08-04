import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reviewSchema } from "@/lib/validators/review";
import { upsertReviewBySlug } from "@/server/services/review.service";
import { HttpError } from "@/server/errors";

/** POST /api/products/[slug]/reviews — create/update the user's review. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to write a review." }, { status: 401 });
  }

  const { slug } = await params;
  const parsed = reviewSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review." },
      { status: 422 }
    );
  }

  try {
    const review = await upsertReviewBySlug(
      session.user.id,
      session.user.name ?? "Customer",
      slug,
      parsed.data
    );
    return NextResponse.json({ review });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reviews] failed", err);
    return NextResponse.json({ error: "Could not save your review." }, { status: 500 });
  }
}
