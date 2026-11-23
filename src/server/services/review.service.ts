import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { reviews, products, orders, type ReviewRow } from "@/server/schema";
import { HttpError } from "@/server/errors";
import type { ReviewInput } from "@/lib/validators/review";
import type { ReviewDTO, ReviewSummary } from "@/types/review";

function toDTO(r: ReviewRow): ReviewDTO {
  return {
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title ?? null,
    body: r.body,
    isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
    createdAt: new Date(r.createdAt).toISOString(),
    reply: r.reply?.body
      ? {
          body: r.reply.body,
          repliedAt: r.reply.repliedAt ? new Date(r.reply.repliedAt).toISOString() : null,
        }
      : null,
  };
}

/** Approved, written reviews for a product (newest first). */
export async function listProductReviews(productId: string): Promise<ReviewDTO[]> {
  const docs = await db()
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt))
    .all();
  return docs.map(toDTO);
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const docs = await db()
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
    .all();
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const d of docs) {
    const r = Math.min(5, Math.max(1, Math.round(d.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[r] += 1;
    sum += d.rating;
  }
  const n = docs.length;
  return {
    count: n,
    average: n ? Math.round((sum / n) * 10) / 10 : 0,
    distribution,
  };
}

export async function getUserReview(userId: string, productId: string): Promise<ReviewDTO | null> {
  const doc = await db()
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.userId, userId)))
    .get();
  return doc ? toDTO(doc) : null;
}

async function productIdFromSlug(slug: string): Promise<string> {
  const product = await db()
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .get();
  if (!product) throw new HttpError("Product not found.", 404);
  return product.id;
}

/**
 * Create or update the current user's review for a product (one per user).
 * Flags verified-purchase when the user has a paid order containing the item.
 */
export async function upsertReviewBySlug(
  userId: string,
  authorName: string,
  slug: string,
  input: ReviewInput
): Promise<ReviewDTO> {
  const productId = await productIdFromSlug(slug);

  const paid = await db()
    .select({ n: count() })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.paymentStatus, "paid"),
        sql`EXISTS (SELECT 1 FROM json_each(${orders.items}) WHERE json_extract(value, '$.product') = ${productId})`
      )
    )
    .get();
  const isVerifiedPurchase = (paid?.n ?? 0) > 0;

  const fields = {
    authorName: authorName || "Customer",
    rating: input.rating,
    title: input.title ?? "",
    body: input.body,
    isVerifiedPurchase,
    status: "approved" as const,
  };

  const existing = await db()
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.userId, userId)))
    .get();

  let row: ReviewRow;
  if (existing) {
    [row] = await db().update(reviews).set(fields).where(eq(reviews.id, existing.id)).returning();
  } else {
    [row] = await db()
      .insert(reviews)
      .values({ productId, userId, ...fields })
      .returning();
  }
  return toDTO(row);
}

// ---- admin moderation --------------------------------------------------

export type AdminReviewRow = {
  id: string;
  productName: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  isVerifiedPurchase: boolean;
  reply: string | null;
  createdAt: string;
};

export async function listAllReviews(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminReviewRow[]; total: number; page: number; pages: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 30;

  const where =
    params.status && params.status !== "all" ? eq(reviews.status, params.status) : undefined;

  const [docs, totalRow] = await Promise.all([
    db()
      .select({
        review: reviews,
        productName: products.name,
        productSlug: products.slug,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all(),
    db().select({ n: count() }).from(reviews).where(where).get(),
  ]);

  const total = totalRow?.n ?? 0;
  const rows: AdminReviewRow[] = docs.map((d) => ({
    id: d.review.id,
    productName: d.productName ?? "—",
    productSlug: d.productSlug ?? "",
    authorName: d.review.authorName,
    rating: d.review.rating,
    title: d.review.title ?? null,
    body: d.review.body,
    status: (d.review.status as AdminReviewRow["status"]) ?? "approved",
    isVerifiedPurchase: Boolean(d.review.isVerifiedPurchase),
    reply: d.review.reply?.body ?? null,
    createdAt: new Date(d.review.createdAt).toISOString(),
  }));

  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function setReviewStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<void> {
  const res = await db()
    .update(reviews)
    .set({ status })
    .where(eq(reviews.id, id))
    .returning({ id: reviews.id });
  if (res.length === 0) throw new HttpError("Review not found.", 404);
}

export async function replyToReview(id: string, body: string): Promise<void> {
  const res = await db()
    .update(reviews)
    .set({ reply: { body: body.trim(), repliedAt: Date.now() } })
    .where(eq(reviews.id, id))
    .returning({ id: reviews.id });
  if (res.length === 0) throw new HttpError("Review not found.", 404);
}

export async function deleteReview(id: string): Promise<void> {
  await db().delete(reviews).where(eq(reviews.id, id));
}
