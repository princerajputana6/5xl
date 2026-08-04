import { connectDB } from "@/server/db";
import { Subscription, type SubscriptionDoc } from "@/server/models/Subscription";
import { Product } from "@/server/models/Product";
import { HttpError } from "@/server/errors";
import type { SubscribeInput } from "@/lib/validators/subscription";

export const SUBSCRIPTION_DISCOUNT_PCT = 10;

export type SubscriptionDTO = {
  id: string;
  productName: string;
  productSlug: string;
  image: string | null;
  variantLabel: string | null;
  price: number;
  discountedPrice: number;
  qty: number;
  intervalDays: number;
  discountPct: number;
  status: "active" | "paused" | "cancelled";
  nextDeliveryAt: string | null;
  createdAt: string;
};

function toDTO(s: SubscriptionDoc): SubscriptionDTO {
  const discountPct = s.discountPct ?? SUBSCRIPTION_DISCOUNT_PCT;
  return {
    id: String(s._id),
    productName: s.productName,
    productSlug: s.productSlug,
    image: s.image ?? null,
    variantLabel: s.variantLabel ?? null,
    price: s.price,
    discountedPrice: Math.round(s.price * (1 - discountPct / 100)),
    qty: s.qty ?? 1,
    intervalDays: s.intervalDays ?? 30,
    discountPct,
    status: (s.status as SubscriptionDTO["status"]) ?? "active",
    nextDeliveryAt: s.nextDeliveryAt ? new Date(s.nextDeliveryAt).toISOString() : null,
    createdAt: new Date(s.createdAt).toISOString(),
  };
}

export async function createSubscription(
  userId: string,
  input: SubscribeInput
): Promise<SubscriptionDTO> {
  await connectDB();
  const product = await Product.findOne({ slug: input.slug, status: "active" }).lean();
  if (!product) throw new HttpError("Product not found.", 404);

  let price = product.price;
  let variantLabel: string | null = null;
  if (input.variantId) {
    const variant = (product.variants ?? []).find(
      (v) => String((v as { _id?: unknown })._id) === input.variantId
    );
    if (!variant) throw new HttpError("Selected variant not found.", 404);
    price = variant.price;
    variantLabel = variant.label;
  }

  const nextDeliveryAt = new Date(Date.now() + input.intervalDays * 24 * 60 * 60 * 1000);

  const doc = await Subscription.create({
    user: userId,
    product: product._id,
    productName: product.name,
    productSlug: product.slug,
    image: (product.images as string[] | undefined)?.[0] ?? null,
    variantId: input.variantId ?? null,
    variantLabel,
    price,
    qty: input.qty ?? 1,
    intervalDays: input.intervalDays,
    discountPct: SUBSCRIPTION_DISCOUNT_PCT,
    status: "active",
    nextDeliveryAt,
  });

  return toDTO(doc);
}

export async function listUserSubscriptions(userId: string): Promise<SubscriptionDTO[]> {
  await connectDB();
  const docs = await Subscription.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return docs.map((d) => toDTO(d as unknown as SubscriptionDoc));
}

export async function updateSubscriptionStatus(
  userId: string,
  id: string,
  action: "pause" | "resume" | "cancel"
): Promise<void> {
  await connectDB();
  const sub = await Subscription.findOne({ _id: id, user: userId });
  if (!sub) throw new HttpError("Subscription not found.", 404);

  if (action === "cancel") sub.status = "cancelled";
  else if (action === "pause") sub.status = "paused";
  else if (action === "resume") {
    sub.status = "active";
    sub.nextDeliveryAt = new Date(Date.now() + (sub.intervalDays ?? 30) * 24 * 60 * 60 * 1000);
  }
  await sub.save();
}

// ---- admin -------------------------------------------------------------

export type AdminSubscriptionRow = SubscriptionDTO & {
  customerName: string;
  customerEmail: string;
};

export async function listAllSubscriptions(): Promise<AdminSubscriptionRow[]> {
  await connectDB();
  const docs = await Subscription.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("user", "name email")
    .lean();
  return docs.map((d) => {
    const s = d as unknown as SubscriptionDoc & {
      user?: { name?: string; email?: string } | null;
    };
    return {
      ...toDTO(s),
      customerName: s.user?.name ?? "—",
      customerEmail: s.user?.email ?? "—",
    };
  });
}
