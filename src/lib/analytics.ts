/**
 * Shared analytics shapes and labels.
 *
 * Kept free of any server imports so client components can use them without
 * dragging mongoose into the browser bundle.
 */

export const RANGES = ["day", "week", "month", "year", "all"] as const;
export type RangeKey = (typeof RANGES)[number];

export const RANGE_LABELS: Record<RangeKey, string> = {
  day: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
  year: "Last 12 months",
  all: "All time",
};

export type Totals = {
  revenue: number;
  orders: number;
  units: number;
  avgOrderValue: number;
  discountGiven: number;
  shippingCollected: number;
  newCustomers: number;
  /** Percentage change against the immediately preceding window. */
  revenueChange: number | null;
  ordersChange: number | null;
};

export type TrendPoint = { label: string; revenue: number; orders: number };

export type TopProduct = {
  name: string;
  slug: string;
  units: number;
  revenue: number;
};

export type StatusSlice = { status: string; count: number; revenue: number };

export type CouponRow = { code: string; uses: number; discount: number };

export type SalesReport = {
  range: RangeKey;
  rangeLabel: string;
  from: string | null;
  to: string;
  totals: Totals;
  trend: TrendPoint[];
  topProducts: TopProduct[];
  statusBreakdown: StatusSlice[];
  coupons: CouponRow[];
  lowStockCount: number;
};
