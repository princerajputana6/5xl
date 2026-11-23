import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { subscriptions, products, users, type SubscriptionRow } from "@/server/schema";
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

function toDTO(s: SubscriptionRow): SubscriptionDTO {
  const discountPct = s.discountPct ?? SUBSCRIPTION_DISCOUNT_PCT;
  return {
    id: s.id,
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
  const product = await db()
    .select()
    .from(products)
    .where(and(eq(products.slug, input.slug), eq(products.status, "active")))
    .get();
  if (!product) throw new HttpError("Product not found.", 404);

  let price = product.price;
  let variantLabel: string | null = null;
  if (input.variantId) {
    const variant = (product.variants ?? []).find((v) => v.id === input.variantId);
    if (!variant) throw new HttpError("Selected variant not found.", 404);
    price = variant.price;
    variantLabel = variant.label;
  }

  const nextDeliveryAt = new Date(Date.now() + input.intervalDays * 24 * 60 * 60 * 1000);

  const [row] = await db()
    .insert(subscriptions)
    .values({
      userId,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      image: (product.images ?? [])[0] ?? null,
      variantId: input.variantId ?? null,
      variantLabel,
      price,
      qty: input.qty ?? 1,
      intervalDays: input.intervalDays,
      discountPct: SUBSCRIPTION_DISCOUNT_PCT,
      status: "active",
      nextDeliveryAt,
    })
    .returning();

  return toDTO(row);
}

export async function listUserSubscriptions(userId: string): Promise<SubscriptionDTO[]> {
  const docs = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .all();
  return docs.map(toDTO);
}

export async function updateSubscriptionStatus(
  userId: string,
  id: string,
  action: "pause" | "resume" | "cancel"
): Promise<void> {
  const sub = await db()
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .get();
  if (!sub) throw new HttpError("Subscription not found.", 404);

  const patch: Partial<typeof subscriptions.$inferInsert> = {};
  if (action === "cancel") patch.status = "cancelled";
  else if (action === "pause") patch.status = "paused";
  else if (action === "resume") {
    patch.status = "active";
    patch.nextDeliveryAt = new Date(Date.now() + (sub.intervalDays ?? 30) * 24 * 60 * 60 * 1000);
  }
  await db().update(subscriptions).set(patch).where(eq(subscriptions.id, id));
}

// ---- admin -------------------------------------------------------------

export type AdminSubscriptionRow = SubscriptionDTO & {
  customerName: string;
  customerEmail: string;
};

export async function listAllSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const docs = await db()
    .select({
      sub: subscriptions,
      customerName: users.name,
      customerEmail: users.email,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(200)
    .all();
  return docs.map((d) => ({
    ...toDTO(d.sub),
    customerName: d.customerName ?? "—",
    customerEmail: d.customerEmail ?? "—",
  }));
}
