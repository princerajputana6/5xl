import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  orders,
  products,
  users,
  counters,
  type OrderRow,
  type OrderPayment,
  type OrderItem,
  type OrderAddress,
  type OrderTimelineEntry,
} from "@/server/schema";
import { computeAmounts } from "@/lib/cart-pricing";
import {
  createGatewayOrder,
  verifyPaymentSignature,
  paymentMode,
  isStub,
  publicKeyId,
} from "@/server/payments/razorpay";
import { priceCartItems } from "@/server/services/pricing";
import { validateCoupon, incrementCouponUsage } from "@/server/services/coupon.service";
import { sendEmailSafe } from "@/server/email/mailer";
import { orderConfirmationEmail } from "@/server/email/templates";
import {
  getRewardPoints,
  earnPointsForOrder,
  redeemPointsForOrder,
} from "@/server/services/wallet.service";
import { HttpError } from "@/server/errors";
import type { CheckoutInput } from "@/lib/validators/checkout";
import type { CheckoutSession, OrderDTO } from "@/types/order";

/** The stored order record (was `OrderDoc` under mongoose). */
export type OrderRecord = OrderRow;

/** Kept as a named subclass for existing imports; behaves like HttpError. */
export class CheckoutError extends HttpError {}

/** Mint a human-friendly, monotonic order number, e.g. "5XL-100042". */
async function mintOrderNumber(): Promise<string> {
  const [row] = await db()
    .insert(counters)
    .values({ id: "order", seq: 1 })
    .onConflictDoUpdate({ target: counters.id, set: { seq: sql`${counters.seq} + 1` } })
    .returning({ seq: counters.seq });
  return `5XL-${100000 + row.seq}`;
}

/**
 * Build an order from the client's cart, pricing every line **server-side**
 * from the database (never trusting client prices), then open a gateway order.
 */
export async function createOrderFromCart(
  userId: string,
  input: CheckoutInput
): Promise<{ order: OrderRecord; session: CheckoutSession }> {
  // Price every line against the DB (authoritative).
  const { lines, subtotal } = await priceCartItems(input.items);
  const items = lines as OrderItem[];

  // Re-validate the coupon server-side; never trust a client-sent discount.
  let discount = 0;
  let couponCode: string | undefined;
  if (input.couponCode?.trim()) {
    const applied = await validateCoupon(input.couponCode, subtotal);
    discount = applied.discount;
    couponCode = applied.coupon.code;
  }

  // Reward-points redemption (1 point = ₹1), capped to the user's balance and
  // the amount remaining after the coupon.
  let pointsUsed = 0;
  if (input.redeemPoints && input.redeemPoints > 0) {
    const balance = await getRewardPoints(userId);
    const maxRedeemable = Math.max(0, subtotal - discount);
    pointsUsed = Math.min(Math.floor(input.redeemPoints), balance, maxRedeemable);
  }

  const amounts = computeAmounts(subtotal, discount, pointsUsed);
  const orderNumber = await mintOrderNumber();

  const gateway = await createGatewayOrder({
    amountInr: amounts.total,
    receipt: orderNumber,
    notes: { userId, orderNumber },
  });

  const address: OrderAddress = {
    name: input.address.name,
    phone: input.address.phone,
    line1: input.address.line1,
    line2: input.address.line2 ?? "",
    city: input.address.city,
    state: input.address.state,
    pincode: input.address.pincode,
    country: input.address.country ?? "India",
  };
  const payment: OrderPayment = {
    provider: "razorpay",
    mode: paymentMode,
    gatewayOrderId: gateway.id,
    status: "created",
  };

  const [order] = await db()
    .insert(orders)
    .values({
      orderNumber,
      userId,
      items,
      amounts,
      total: amounts.total,
      couponCode,
      pointsUsed,
      address,
      payment,
      paymentStatus: "created",
      gatewayOrderId: gateway.id,
      status: "pending",
      timeline: [{ status: "pending", note: "Order created, awaiting payment.", at: Date.now() }],
      placedAt: new Date(),
    })
    .returning();

  const session: CheckoutSession = {
    orderId: order.id,
    orderNumber,
    gatewayOrderId: gateway.id,
    amount: gateway.amount,
    currency: gateway.currency,
    keyId: publicKeyId,
    stub: isStub,
  };

  return { order, session };
}

/** Best-effort stock decrement after a confirmed payment. */
async function decrementStock(order: OrderRecord): Promise<void> {
  for (const item of order.items) {
    try {
      if (item.variantId) {
        const p = await db()
          .select({ variants: products.variants, stock: products.stock })
          .from(products)
          .where(eq(products.id, item.product))
          .get();
        if (!p) continue;
        const variants = (p.variants ?? []).map((v) =>
          v.id === item.variantId ? { ...v, stock: (v.stock ?? 0) - item.qty } : v
        );
        await db()
          .update(products)
          .set({ variants, stock: (p.stock ?? 0) - item.qty })
          .where(eq(products.id, item.product));
      } else {
        const p = await db()
          .select({ stock: products.stock })
          .from(products)
          .where(eq(products.id, item.product))
          .get();
        if (!p) continue;
        await db()
          .update(products)
          .set({ stock: (p.stock ?? 0) - item.qty })
          .where(eq(products.id, item.product));
      }
    } catch {
      /* best-effort — never block the order on a stock write */
    }
  }
}

/**
 * Verify the payment signature and mark the order confirmed. Idempotent: a
 * repeat call for an already-paid order is a no-op.
 */
export async function markOrderPaid(params: {
  gatewayOrderId: string;
  paymentId: string;
  signature: string;
  method?: string;
  userId?: string;
  /** Webhook path: authenticity already proven by the webhook HMAC. */
  trusted?: boolean;
}): Promise<OrderRecord> {
  if (!params.trusted) {
    const ok = verifyPaymentSignature({
      gatewayOrderId: params.gatewayOrderId,
      paymentId: params.paymentId,
      signature: params.signature,
    });
    if (!ok) {
      throw new CheckoutError("Payment signature verification failed.", 400);
    }
  }

  const order = await db()
    .select()
    .from(orders)
    .where(eq(orders.gatewayOrderId, params.gatewayOrderId))
    .get();
  if (!order) throw new CheckoutError("Order not found.", 404);

  // If a userId is supplied (verify endpoint), enforce ownership.
  if (params.userId && order.userId !== params.userId) {
    throw new CheckoutError("Order not found.", 404);
  }

  if (order.paymentStatus === "paid") return order; // idempotent

  const payment: OrderPayment = {
    ...order.payment,
    provider: "razorpay",
    mode: order.payment?.mode ?? paymentMode,
    gatewayOrderId: params.gatewayOrderId,
    paymentId: params.paymentId,
    signature: params.signature,
    method: params.method ?? order.payment?.method,
    status: "paid",
    paidAt: Date.now(),
  };
  const timeline: OrderTimelineEntry[] = [
    ...(order.timeline ?? []),
    { status: "confirmed", note: "Payment received.", at: Date.now() },
  ];

  const [updated] = await db()
    .update(orders)
    .set({ payment, paymentStatus: "paid", status: "confirmed", timeline })
    .where(eq(orders.id, order.id))
    .returning();

  await decrementStock(updated);
  // Count the coupon only once payment actually lands (this path is idempotent).
  if (updated.couponCode) {
    await incrementCouponUsage(updated.couponCode).catch(() => {});
  }

  // Reward points: spend what was redeemed, then earn on the paid total.
  try {
    if (updated.pointsUsed && updated.pointsUsed > 0) {
      await redeemPointsForOrder(updated.userId, updated.orderNumber, updated.pointsUsed);
    }
    await earnPointsForOrder(updated.userId, updated.orderNumber, updated.amounts?.total ?? 0);
  } catch (err) {
    console.error("[order] points update failed", err);
  }

  // Best-effort order confirmation email (never blocks the order).
  try {
    const user = await db()
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, updated.userId))
      .get();
    if (user?.email) {
      const { subject, html } = orderConfirmationEmail({
        name: user.name ?? "there",
        email: user.email,
        orderNumber: updated.orderNumber,
        items: updated.items.map((i) => ({ name: i.name, qty: i.qty, lineTotal: i.lineTotal })),
        subtotal: updated.amounts?.subtotal ?? 0,
        shipping: updated.amounts?.shipping ?? 0,
        discount: updated.amounts?.discount ?? 0,
        total: updated.amounts?.total ?? 0,
      });
      sendEmailSafe({ to: user.email, subject, html });
    }
  } catch (err) {
    console.error("[order] confirmation email failed", err);
  }

  return updated;
}

export async function markOrderFailed(gatewayOrderId: string): Promise<void> {
  const order = await db()
    .select()
    .from(orders)
    .where(eq(orders.gatewayOrderId, gatewayOrderId))
    .get();
  if (!order || order.paymentStatus === "paid") return;
  const payment: OrderPayment = { ...order.payment, status: "failed" };
  const timeline: OrderTimelineEntry[] = [
    ...(order.timeline ?? []),
    { status: "pending", note: "Payment failed or was abandoned.", at: Date.now() },
  ];
  await db()
    .update(orders)
    .set({ payment, paymentStatus: "failed", timeline })
    .where(eq(orders.id, order.id));
}

/**
 * Cancel an order the shopper never paid for. Stock is only decremented once a
 * payment confirms, so an unpaid cancel has nothing to restore. Paid orders are
 * refused here — those need a refund, which is an admin action.
 */
export async function cancelPendingOrder(userId: string, orderNumber: string): Promise<void> {
  const order = await db()
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.orderNumber, orderNumber)))
    .get();
  if (!order) throw new HttpError("Order not found.", 404);

  if (order.status === "cancelled") return; // already done — treat as success

  if (order.paymentStatus === "paid" || order.status !== "pending") {
    throw new HttpError(
      "Only orders awaiting payment can be cancelled. Contact support for help with this order.",
      409
    );
  }

  const payment: OrderPayment = { ...order.payment, status: "failed" };
  const timeline: OrderTimelineEntry[] = [
    ...(order.timeline ?? []),
    { status: "cancelled", note: "Cancelled by you before payment.", at: Date.now() },
  ];
  await db()
    .update(orders)
    .set({ status: "cancelled", payment, paymentStatus: "failed", timeline })
    .where(eq(orders.id, order.id));
}

// ---- reads -------------------------------------------------------------

export function toOrderDTO(o: OrderRecord): OrderDTO {
  const amounts = o.amounts ?? {
    subtotal: 0,
    shipping: 0,
    discount: 0,
    pointsRedeemed: 0,
    tax: 0,
    total: 0,
    currency: "INR",
  };
  const payment = o.payment ?? ({} as OrderPayment);
  const address = o.address ?? ({} as OrderAddress);
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    items: (o.items ?? []).map((i) => ({
      productId: i.product,
      slug: i.slug,
      name: i.name,
      image: i.image ?? null,
      variantId: i.variantId ?? null,
      variantLabel: i.variantLabel ?? null,
      price: i.price,
      mrp: i.mrp,
      qty: i.qty,
      lineTotal: i.lineTotal,
    })),
    amounts: {
      subtotal: amounts.subtotal ?? 0,
      shipping: amounts.shipping ?? 0,
      discount: amounts.discount ?? 0,
      pointsRedeemed: amounts.pointsRedeemed ?? 0,
      tax: amounts.tax ?? 0,
      total: amounts.total ?? 0,
      currency: amounts.currency ?? "INR",
    },
    address: {
      name: address.name ?? "",
      phone: address.phone ?? "",
      line1: address.line1 ?? "",
      line2: address.line2 ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      pincode: address.pincode ?? "",
      country: address.country ?? "India",
    },
    couponCode: o.couponCode ?? null,
    pointsUsed: o.pointsUsed ?? 0,
    status: o.status as OrderDTO["status"],
    payment: {
      provider: payment.provider ?? "razorpay",
      mode: payment.mode ?? "stub",
      status: payment.status ?? "created",
      method: payment.method ?? null,
      paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
    },
    timeline: (o.timeline ?? []).map((t) => ({
      status: t.status,
      note: t.note ?? undefined,
      at: new Date(t.at).toISOString(),
    })),
    placedAt: new Date(o.placedAt ?? o.createdAt).toISOString(),
  };
}

export async function getUserOrders(userId: string): Promise<OrderDTO[]> {
  const docs = await db()
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .all();
  return docs.map(toOrderDTO);
}

export async function getUserOrderByNumber(
  userId: string,
  orderNumber: string
): Promise<OrderDTO | null> {
  const doc = await db()
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.orderNumber, orderNumber)))
    .get();
  return doc ? toOrderDTO(doc) : null;
}
