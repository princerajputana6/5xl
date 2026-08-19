import { connectDB } from "@/server/db";
import { Order } from "@/server/models/Order";
import { Product } from "@/server/models/Product";
import { User } from "@/server/models/User";
import {
  RANGE_LABELS,
  type RangeKey,
  type SalesReport,
  type Totals,
} from "@/lib/analytics";

export * from "@/lib/analytics";

/** Only orders that were actually paid for count towards revenue. */
const PAID_MATCH = { "payment.status": "paid" } as const;

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

async function totalsFor(from: Date | null, to: Date): Promise<{
  revenue: number;
  orders: number;
  units: number;
  discount: number;
  shipping: number;
}> {
  const match: Record<string, unknown> = { ...PAID_MATCH };
  if (from) match.placedAt = { $gte: from, $lte: to };
  else match.placedAt = { $lte: to };

  const [row] = await Order.aggregate<{
    revenue: number;
    orders: number;
    units: number;
    discount: number;
    shipping: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$amounts.total" },
        orders: { $sum: 1 },
        units: { $sum: { $sum: "$items.qty" } },
        discount: { $sum: "$amounts.discount" },
        shipping: { $sum: "$amounts.shipping" },
      },
    },
  ]);

  return {
    revenue: row?.revenue ?? 0,
    orders: row?.orders ?? 0,
    units: row?.units ?? 0,
    discount: row?.discount ?? 0,
    shipping: row?.shipping ?? 0,
  };
}

/** Everything the sales dashboard and its PDF export need, for one window. */
export async function getSalesReport(range: RangeKey): Promise<SalesReport> {
  await connectDB();

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

  const match: Record<string, unknown> = { ...PAID_MATCH };
  if (from) match.placedAt = { $gte: from, $lte: to };

  const dateFormat =
    bucket === "hour" ? "%H:00" : bucket === "day" ? "%d %b" : "%b %Y";
  const sortFormat =
    bucket === "hour" ? "%Y-%m-%dT%H" : bucket === "day" ? "%Y-%m-%d" : "%Y-%m";

  const [
    current,
    previous,
    trendRows,
    topRows,
    statusRows,
    couponRows,
    newCustomers,
    lowStockCount,
  ] = await Promise.all([
    totalsFor(from, to),
    prevFrom && prevTo ? totalsFor(prevFrom, prevTo) : Promise.resolve(null),

    Order.aggregate<{ _id: { sort: string; label: string }; revenue: number; orders: number }>([
      { $match: match },
      {
        $group: {
          _id: {
            sort: { $dateToString: { format: sortFormat, date: "$placedAt" } },
            label: { $dateToString: { format: dateFormat, date: "$placedAt" } },
          },
          revenue: { $sum: "$amounts.total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.sort": 1 } },
    ]),

    Order.aggregate<{ _id: string; name: string; slug: string; units: number; revenue: number }>([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.slug",
          name: { $first: "$items.name" },
          slug: { $first: "$items.slug" },
          units: { $sum: "$items.qty" },
          revenue: { $sum: "$items.lineTotal" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),

    // Status mix covers every order, paid or not — that's the point of it.
    Order.aggregate<{ _id: string; count: number; revenue: number }>([
      ...(from ? [{ $match: { placedAt: { $gte: from, $lte: to } } }] : []),
      { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amounts.total" } } },
      { $sort: { count: -1 } },
    ]),

    Order.aggregate<{ _id: string; uses: number; discount: number }>([
      { $match: { ...match, couponCode: { $nin: [null, ""] } } },
      { $group: { _id: "$couponCode", uses: { $sum: 1 }, discount: { $sum: "$amounts.discount" } } },
      { $sort: { uses: -1 } },
      { $limit: 10 },
    ]),

    User.countDocuments(from ? { createdAt: { $gte: from, $lte: to } } : {}),
    Product.countDocuments({ stock: { $lte: 5 } }),
  ]);

  const totals: Totals = {
    revenue: current.revenue,
    orders: current.orders,
    units: current.units,
    avgOrderValue: current.orders ? Math.round(current.revenue / current.orders) : 0,
    discountGiven: current.discount,
    shippingCollected: current.shipping,
    newCustomers,
    revenueChange: previous ? pctChange(current.revenue, previous.revenue) : null,
    ordersChange: previous ? pctChange(current.orders, previous.orders) : null,
  };

  return {
    range,
    rangeLabel: RANGE_LABELS[range],
    from: from?.toISOString() ?? null,
    to: to.toISOString(),
    totals,
    trend: trendRows.map((r) => ({
      label: r._id.label,
      revenue: r.revenue,
      orders: r.orders,
    })),
    topProducts: topRows.map((r) => ({
      name: r.name,
      slug: r.slug,
      units: r.units,
      revenue: r.revenue,
    })),
    statusBreakdown: statusRows.map((r) => ({
      status: r._id ?? "unknown",
      count: r.count,
      revenue: r.revenue ?? 0,
    })),
    coupons: couponRows.map((r) => ({
      code: r._id,
      uses: r.uses,
      discount: r.discount ?? 0,
    })),
    lowStockCount,
  };
}
