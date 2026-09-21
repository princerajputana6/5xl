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

/* ------------------------------------------------------------------ */
/* Cart reward tiers (spend-more-to-unlock offer bar)                  */
/* ------------------------------------------------------------------ */

export type RewardTier = {
  /** Subtotal (₹) at which this reward unlocks. */
  threshold: number;
  /** Short label shown in the bar, e.g. "a ₹500 coupon". */
  reward: string;
  /** Optional coupon code the shopper applies at checkout once unlocked. */
  couponCode?: string;
};

/**
 * Ordered ascending. Drives the cart "spend ₹X more to unlock …" bar.
 * Keep the coupon codes in sync with real coupons in the admin CMS.
 */
export const REWARD_TIERS: RewardTier[] = [
  { threshold: FREE_SHIPPING_THRESHOLD, reward: "free shipping" },
  { threshold: 5000, reward: "a ₹500 coupon", couponCode: "FUEL500" },
];

/** The next tier the shopper has not yet reached, or null if all unlocked. */
export function nextRewardTier(subtotal: number): RewardTier | null {
  return REWARD_TIERS.find((t) => subtotal < t.threshold) ?? null;
}

/** Tiers already unlocked by the current subtotal. */
export function unlockedRewardTiers(subtotal: number): RewardTier[] {
  return REWARD_TIERS.filter((t) => subtotal >= t.threshold);
}

/** Progress (0–100) toward the next tier, measured within its own segment. */
export function rewardProgressPct(subtotal: number): number {
  const next = nextRewardTier(subtotal);
  if (!next) return 100;
  const idx = REWARD_TIERS.indexOf(next);
  const prev = idx === 0 ? 0 : REWARD_TIERS[idx - 1].threshold;
  return Math.min(100, Math.max(0, ((subtotal - prev) / (next.threshold - prev)) * 100));
}
