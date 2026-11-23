import { and, count, eq, gte, lte } from "drizzle-orm";
import { db } from "@/server/db";
import { orders, products, users, type OrderRow } from "@/server/schema";
import {
  RANGE_LABELS,
  type RangeKey,
  type SalesReport,
  type Totals,
} from "@/lib/analytics";

export * from "@/lib/analytics";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Start of the window, plus the bucket size used for the trend series. */
export function rangeBounds(range: RangeKey): {
  from: Date | null;
  bucket: "hour" | "day" | "month";
} {
  const now = new Date();
  switch (range) {
    case "day": {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { from, bucket: "hour" };
    }
    case "week": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, bucket: "day" };
    }
    case "month": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      return { from, bucket: "day" };
    }
    case "year": {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 11);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      return { from, bucket: "month" };
    }
    default:
      return { from: null, bucket: "month" };
  }
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null; // no baseline to compare against
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Time-bucket key (sortable) + human label for the trend series. */
function bucketKey(d: Date, bucket: "hour" | "day" | "month"): { sort: string; label: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const h = d.getHours();
  if (bucket === "hour") {
    return { sort: `${y}-${pad(m + 1)}-${pad(day)}T${pad(h)}`, label: `${pad(h)}:00` };
  }
  if (bucket === "day") {
    return { sort: `${y}-${pad(m + 1)}-${pad(day)}`, label: `${pad(day)} ${MONTHS[m]}` };
  }
  return { sort: `${y}-${pad(m + 1)}`, label: `${MONTHS[m]} ${y}` };
}

type PaidOrderRow = {
  placedAt: Date;
  total: number;
  amounts: OrderRow["amounts"];
  items: OrderRow["items"];
  couponCode: string | null;
};

/** Paid orders whose placedAt falls within [from?, to], for in-JS aggregation. */
async function paidOrdersBetween(from: Date | null, to: Date): Promise<PaidOrderRow[]> {
  const conds = [eq(orders.paymentStatus, "paid"), lte(orders.placedAt, to)];
  if (from) conds.push(gte(orders.placedAt, from));
  return db()
    .select({
      placedAt: orders.placedAt,
      total: orders.total,
      amounts: orders.amounts,
      items: orders.items,
      couponCode: orders.couponCode,
    })
    .from(orders)
    .where(and(...conds))
    .all();
}

function summarize(rows: PaidOrderRow[]) {
  let revenue = 0;
  let units = 0;
  let discount = 0;
  let shipping = 0;
  for (const o of rows) {
    revenue += o.total ?? 0;
    units += (o.items ?? []).reduce((s, i) => s + (i.qty ?? 0), 0);
    discount += o.amounts?.discount ?? 0;
    shipping += o.amounts?.shipping ?? 0;
  }
  return { revenue, orders: rows.length, units, discount, shipping };
}

/** Everything the sales dashboard and its PDF export need, for one window. */
export async function getSalesReport(range: RangeKey): Promise<SalesReport> {
  const to = new Date();
  const { from, bucket } = rangeBounds(range);

  // The equivalent window immediately before this one, for the change figures.
  let prevFrom: Date | null = null;
  let prevTo: Date | null = null;
  if (from) {
    const span = to.getTime() - from.getTime();
    prevTo = new Date(from.getTime() - 1);
    prevFrom = new Date(from.getTime() - span);
  }

  // Status mix covers every order, paid or not.
  let statusQuery = db()
    .select({ status: orders.status, total: orders.total })
    .from(orders)
    .$dynamic();
  if (from) statusQuery = statusQuery.where(and(gte(orders.placedAt, from), lte(orders.placedAt, to)));

  let newCustomersQuery = db().select({ n: count() }).from(users).$dynamic();
  if (from)
    newCustomersQuery = newCustomersQuery.where(
      and(gte(users.createdAt, from), lte(users.createdAt, to))
    );

  const [currentRows, previousRows, allInRange, newCustomersRow, lowStockRow] = await Promise.all([
    paidOrdersBetween(from, to),
    prevFrom && prevTo ? paidOrdersBetween(prevFrom, prevTo) : Promise.resolve(null),
    statusQuery.all(),
    newCustomersQuery.get(),
    db().select({ n: count() }).from(products).where(lte(products.stock, 5)).get(),
  ]);

  const current = summarize(currentRows);
  const previous = previousRows ? summarize(previousRows) : null;

  // Trend series (buckets with activity only, matching the old pipeline).
  const trendMap = new Map<string, { label: string; revenue: number; orders: number }>();
  for (const o of currentRows) {
    const { sort, label } = bucketKey(new Date(o.placedAt), bucket);
    const e = trendMap.get(sort) ?? { label, revenue: 0, orders: 0 };
    e.revenue += o.total ?? 0;
    e.orders += 1;
    trendMap.set(sort, e);
  }
  const trend = [...trendMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([, v]) => v);

  // Top products by revenue.
  const topMap = new Map<string, { name: string; slug: string; units: number; revenue: number }>();
  for (const o of currentRows) {
    for (const i of o.items ?? []) {
      const e = topMap.get(i.slug) ?? { name: i.name, slug: i.slug, units: 0, revenue: 0 };
      e.units += i.qty ?? 0;
      e.revenue += i.lineTotal ?? 0;
      topMap.set(i.slug, e);
    }
  }
  const topProducts = [...topMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Status breakdown.
  const statusMap = new Map<string, { status: string; count: number; revenue: number }>();
  for (const o of allInRange) {
    const key = o.status ?? "unknown";
    const e = statusMap.get(key) ?? { status: key, count: 0, revenue: 0 };
    e.count += 1;
    e.revenue += o.total ?? 0;
    statusMap.set(key, e);
  }
  const statusBreakdown = [...statusMap.values()].sort((a, b) => b.count - a.count);

  // Coupon usage.
  const couponMap = new Map<string, { code: string; uses: number; discount: number }>();
  for (const o of currentRows) {
    if (!o.couponCode) continue;
    const e = couponMap.get(o.couponCode) ?? { code: o.couponCode, uses: 0, discount: 0 };
    e.uses += 1;
    e.discount += o.amounts?.discount ?? 0;
    couponMap.set(o.couponCode, e);
  }
  const coupons = [...couponMap.values()].sort((a, b) => b.uses - a.uses).slice(0, 10);

  const totals: Totals = {
    revenue: current.revenue,
    orders: current.orders,
    units: current.units,
    avgOrderValue: current.orders ? Math.round(current.revenue / current.orders) : 0,
    discountGiven: current.discount,
    shippingCollected: current.shipping,
    newCustomers: newCustomersRow?.n ?? 0,
    revenueChange: previous ? pctChange(current.revenue, previous.revenue) : null,
    ordersChange: previous ? pctChange(current.orders, previous.orders) : null,
  };

  return {
    range,
    rangeLabel: RANGE_LABELS[range],
    from: from?.toISOString() ?? null,
    to: to.toISOString(),
    totals,
    trend,
    topProducts,
    statusBreakdown,
    coupons,
    lowStockCount: lowStockRow?.n ?? 0,
  };
}
