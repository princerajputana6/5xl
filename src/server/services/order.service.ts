import { connectDB } from "@/server/db";
import { Order, type OrderDoc } from "@/server/models/Order";
import { Product } from "@/server/models/Product";
import { nextSequence } from "@/server/models/Counter";
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
import { User } from "@/server/models/User";
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

/** Kept as a named subclass for existing imports; behaves like HttpError. */
export class CheckoutError extends HttpError {}

/** Mint a human-friendly order number, e.g. "5XL-100042". */
async function mintOrderNumber(): Promise<string> {
  const seq = await nextSequence("order");
  return `5XL-${100000 + seq}`;
}

/**
 * Build an order from the client's cart, pricing every line **server-side**
 * from the database (never trusting client prices), then open a gateway order.
 */
export async function createOrderFromCart(
  userId: string,
  input: CheckoutInput
): Promise<{ order: OrderDoc; session: CheckoutSession }> {
  await connectDB();

  // Price every line against the DB (authoritative).
  const { lines: items, subtotal } = await priceCartItems(input.items);

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

  const order = await Order.create({
    orderNumber,
    user: userId,
    items,
    amounts,
    couponCode,
    pointsUsed,
    address: input.address,
    payment: {
      provider: "razorpay",
      mode: paymentMode,
      gatewayOrderId: gateway.id,
      status: "created",
    },
    status: "pending",
    timeline: [{ status: "pending", note: "Order created, awaiting payment." }],
  });

  const session: CheckoutSession = {
    orderId: String(order._id),
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
async function decrementStock(order: OrderDoc): Promise<void> {
  for (const item of order.items) {
    const productId = String(item.product);
    if (item.variantId) {
      await Product.updateOne(
        { _id: productId, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": -item.qty, stock: -item.qty } }
      ).catch(() => {});
    } else {
      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: -item.qty } }
      ).catch(() => {});
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
}): Promise<OrderDoc> {
  await connectDB();

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

  const order = await Order.findOne({
    "payment.gatewayOrderId": params.gatewayOrderId,
  });
  if (!order) throw new CheckoutError("Order not found.", 404);

  // If a userId is supplied (verify endpoint), enforce ownership.
  if (params.userId && String(order.user) !== params.userId) {
    throw new CheckoutError("Order not found.", 404);
  }

  if (order.payment?.status === "paid") return order; // idempotent

  order.payment = {
    ...order.payment,
    provider: "razorpay",
    mode: order.payment?.mode ?? paymentMode,
    gatewayOrderId: params.gatewayOrderId,
    paymentId: params.paymentId,
    signature: params.signature,
    method: params.method ?? order.payment?.method,
    status: "paid",
    paidAt: new Date(),
  } as OrderDoc["payment"];
  order.status = "confirmed";
  order.timeline.push({
    status: "confirmed",
    note: "Payment received.",
    at: new Date(),
  } as OrderDoc["timeline"][number]);

  await order.save();
  await decrementStock(order);
  // Count the coupon only once payment actually lands (this path is idempotent).
  if (order.couponCode) {
    await incrementCouponUsage(order.couponCode).catch(() => {});
  }

  // Reward points: spend what was redeemed, then earn on the paid total.
  try {
    if (order.pointsUsed && order.pointsUsed > 0) {
      await redeemPointsForOrder(String(order.user), order.orderNumber, order.pointsUsed);
    }
    await earnPointsForOrder(String(order.user), order.orderNumber, order.amounts?.total ?? 0);
  } catch (err) {
    console.error("[order] points update failed", err);
  }

  // Best-effort order confirmation email (never blocks the order).
  try {
    const user = await User.findById(order.user).select("name email").lean();
    if (user?.email) {
      const { subject, html } = orderConfirmationEmail({
        name: user.name ?? "there",
        email: user.email,
        orderNumber: order.orderNumber,
        items: order.items.map((i) => ({ name: i.name, qty: i.qty, lineTotal: i.lineTotal })),
        subtotal: order.amounts?.subtotal ?? 0,
        shipping: order.amounts?.shipping ?? 0,
        discount: order.amounts?.discount ?? 0,
        total: order.amounts?.total ?? 0,
      });
      sendEmailSafe({ to: user.email, subject, html });
    }
  } catch (err) {
    console.error("[order] confirmation email failed", err);
  }

  return order;
}

export async function markOrderFailed(gatewayOrderId: string): Promise<void> {
  await connectDB();
  const order = await Order.findOne({ "payment.gatewayOrderId": gatewayOrderId });
  if (!order || order.payment?.status === "paid") return;
  order.payment = { ...order.payment, status: "failed" } as OrderDoc["payment"];
  order.timeline.push({
    status: "pending",
    note: "Payment failed or was abandoned.",
    at: new Date(),
  } as OrderDoc["timeline"][number]);
  await order.save();
}

/**
 * Cancel an order the shopper never paid for. Stock is only decremented once a
 * payment confirms, so an unpaid cancel has nothing to restore. Paid orders are
 * refused here — those need a refund, which is an admin action.
 */
export async function cancelPendingOrder(
  userId: string,
  orderNumber: string
): Promise<void> {
  await connectDB();
  const order = await Order.findOne({ user: userId, orderNumber });
  if (!order) throw new HttpError("Order not found.", 404);

  if (order.status === "cancelled") return; // already done — treat as success

  if (order.payment?.status === "paid" || order.status !== "pending") {
    throw new HttpError(
      "Only orders awaiting payment can be cancelled. Contact support for help with this order.",
      409
    );
  }

  order.status = "cancelled";
  order.payment = { ...order.payment, status: "failed" } as OrderDoc["payment"];
  order.timeline.push({
    status: "cancelled",
    note: "Cancelled by you before payment.",
    at: new Date(),
  } as OrderDoc["timeline"][number]);
  await order.save();
}

// ---- reads -------------------------------------------------------------

export function toOrderDTO(o: OrderDoc): OrderDTO {
  const amounts = o.amounts ?? { subtotal: 0, shipping: 0, discount: 0, pointsRedeemed: 0, tax: 0, total: 0, currency: "INR" };
  const payment = o.payment ?? {};
  const address = o.address ?? {};
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    items: o.items.map((i) => ({
      productId: String(i.product),
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
      mode: (payment.mode as "live" | "stub") ?? "stub",
      status: (payment.status as "created" | "paid" | "failed") ?? "created",
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
  await connectDB();
  const docs = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return docs.map((d) => toOrderDTO(d as unknown as OrderDoc));
}

export async function getUserOrderByNumber(
  userId: string,
  orderNumber: string
): Promise<OrderDTO | null> {
  await connectDB();
  const doc = await Order.findOne({ user: userId, orderNumber }).lean();
  return doc ? toOrderDTO(doc as unknown as OrderDoc) : null;
}
