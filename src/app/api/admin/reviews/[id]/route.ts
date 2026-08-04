import { NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api-guard";
import { reviewStatusSchema, reviewReplySchema } from "@/lib/validators/review";
import {
  setReviewStatus,
  replyToReview,
  deleteReview,
} from "@/server/services/review.service";
import { HttpError } from "@/server/errors";

/**
 * PATCH /api/admin/reviews/[id]
 *  - `{ setStatus }` → approve / reject / pending (rejected hides it publicly)
 *  - `{ reply }`     → store reply (surfaces on the product page)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const status = reviewStatusSchema.safeParse(body);
  if (status.success) {
    try {
      await setReviewStatus(id, status.data.setStatus);
      return NextResponse.json({ ok: true });
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }
  }

  const reply = reviewReplySchema.safeParse(body);
  if (reply.success) {
    try {
      await replyToReview(id, reply.data.reply);
      return NextResponse.json({ ok: true });
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "Invalid request." }, { status: 422 });
}

/** DELETE /api/admin/reviews/[id] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  await deleteReview(id);
  return NextResponse.json({ ok: true });
}
