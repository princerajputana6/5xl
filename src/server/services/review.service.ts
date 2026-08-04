import { connectDB } from "@/server/db";
import { Review, type ReviewDoc } from "@/server/models/Review";
import { Product } from "@/server/models/Product";
import { Order } from "@/server/models/Order";
import { HttpError } from "@/server/errors";
import type { ReviewInput } from "@/lib/validators/review";
import type { ReviewDTO, ReviewSummary } from "@/types/review";

function toDTO(r: ReviewDoc): ReviewDTO {
  return {
    id: String(r._id),
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
  await connectDB();
  const docs = await Review.find({ product: productId, status: "approved" })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((d) => toDTO(d as unknown as ReviewDoc));
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  await connectDB();
  const docs = await Review.find({ product: productId, status: "approved" })
    .select("rating")
    .lean();
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const d of docs) {
    const r = Math.min(5, Math.max(1, Math.round(d.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[r] += 1;
    sum += d.rating;
  }
  const count = docs.length;
  return {
    count,
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    distribution,
  };
}

export async function getUserReview(
  userId: string,
  productId: string
): Promise<ReviewDTO | null> {
  await connectDB();
  const doc = await Review.findOne({ product: productId, user: userId }).lean();
  return doc ? toDTO(doc as unknown as ReviewDoc) : null;
}

async function productIdFromSlug(slug: string): Promise<string> {
  await connectDB();
  const product = await Product.findOne({ slug, status: "active" }).select("_id").lean();
  if (!product) throw new HttpError("Product not found.", 404);
  return String(product._id);
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

  const isVerifiedPurchase = Boolean(
    await Order.exists({
      user: userId,
      "payment.status": "paid",
      "items.product": productId,
    })
  );

  const doc = await Review.findOneAndUpdate(
    { product: productId, user: userId },
    {
      $set: {
        authorName: authorName || "Customer",
        rating: input.rating,
        title: input.title ?? "",
        body: input.body,
        isVerifiedPurchase,
        status: "approved",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return toDTO(doc as unknown as ReviewDoc);
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

type PopulatedReview = ReviewDoc & {
  product?: { name?: string; slug?: string } | null;
};

function toAdminRow(r: PopulatedReview): AdminReviewRow {
  return {
    id: String(r._id),
    productName: r.product?.name ?? "—",
    productSlug: r.product?.slug ?? "",
    authorName: r.authorName,
    rating: r.rating,
    title: r.title ?? null,
    body: r.body,
    status: (r.status as AdminReviewRow["status"]) ?? "approved",
    isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
    reply: r.reply?.body ?? null,
    createdAt: new Date(r.createdAt).toISOString(),
  };
}

export async function listAllReviews(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminReviewRow[]; total: number; page: number; pages: number }> {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 30;

  const filter: Record<string, unknown> = {};
  if (params.status && params.status !== "all") filter.status = params.status;

  const [docs, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("product", "name slug")
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    rows: docs.map((d) => toAdminRow(d as unknown as PopulatedReview)),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function setReviewStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<void> {
  await connectDB();
  const res = await Review.updateOne({ _id: id }, { $set: { status } });
  if (res.matchedCount === 0) throw new HttpError("Review not found.", 404);
}

export async function replyToReview(id: string, body: string): Promise<void> {
  await connectDB();
  const res = await Review.updateOne(
    { _id: id },
    { $set: { reply: { body: body.trim(), repliedAt: new Date() } } }
  );
  if (res.matchedCount === 0) throw new HttpError("Review not found.", 404);
}

export async function deleteReview(id: string): Promise<void> {
  await connectDB();
  await Review.deleteOne({ _id: id });
}
