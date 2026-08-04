/** Single source of truth for cart/checkout money math (client + server). */

export const FREE_SHIPPING_THRESHOLD = 999;
export const FLAT_SHIPPING = 79;

export function shippingFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

export type Amounts = {
  subtotal: number;
  shipping: number;
  discount: number;
  pointsRedeemed: number;
  tax: number;
  total: number;
  currency: string;
};

/** Build the amounts breakdown from a server-computed subtotal. */
export function computeAmounts(subtotal: number, discount = 0, pointsRedeemed = 0): Amounts {
  const shipping = shippingFor(subtotal);
  const total = Math.max(0, subtotal - discount - pointsRedeemed) + shipping;
  return { subtotal, shipping, discount, pointsRedeemed, tax: 0, total, currency: "INR" };
}

/** How many reward points an order total earns (2% back, 1 point = ₹1). */
export const POINTS_EARN_RATE = 0.02;
export function pointsEarnedFor(total: number): number {
  return Math.floor(total * POINTS_EARN_RATE);
}
