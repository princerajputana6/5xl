import { connectDB } from "@/server/db";
import { Order, type OrderDoc } from "@/server/models/Order";
import { Product } from "@/server/models/Product";
import { User } from "@/server/models/User";
import { Brand } from "@/server/models/Brand";
import { Category } from "@/server/models/Category";
import { toOrderDTO } from "@/server/services/order.service";
import type { OrderDTO, OrderStatus } from "@/types/order";
import type { AdminProductInput } from "@/lib/validators/admin";

// ---- dashboard ---------------------------------------------------------

export type DashboardStats = {
  revenue: number;
  paidOrders: number;
  totalOrders: number;
  pendingOrders: number;
  products: number;
  customers: number;
  lowStock: number;
  recentOrders: AdminOrderRow[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();
  const [revenueAgg, totalOrders, pendingOrders, products, customers, lowStock, recent] =
    await Promise.all([
      Order.aggregate<{ _id: null; revenue: number; count: number }>([
        { $match: { "payment.status": "paid" } },
        { $group: { _id: null, revenue: { $sum: "$amounts.total" }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({}),
      Order.countDocuments({ status: "pending" }),
      Product.countDocuments({}),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Order.find({}).sort({ createdAt: -1 }).limit(6).populate("user", "name email").lean(),
    ]);

  return {
    revenue: revenueAgg[0]?.revenue ?? 0,
    paidOrders: revenueAgg[0]?.count ?? 0,
    totalOrders,
    pendingOrders,
    products,
    customers,
    lowStock,
    recentOrders: recent.map((o) => toOrderRow(o as unknown as PopulatedOrder)),
  };
}

// ---- orders ------------------------------------------------------------

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  paymentStatus: string;
  itemCount: number;
  placedAt: string;
};

type PopulatedOrder = OrderDoc & {
  user?: { _id?: unknown; name?: string; email?: string } | null;
};

function toOrderRow(o: PopulatedOrder): AdminOrderRow {
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    customerName: o.user?.name ?? "—",
    customerEmail: o.user?.email ?? "—",
    total: o.amounts?.total ?? 0,
    status: o.status as OrderStatus,
    paymentStatus: o.payment?.status ?? "created",
    itemCount: o.items?.length ?? 0,
    placedAt: new Date(o.placedAt ?? o.createdAt).toISOString(),
  };
}

export async function listOrders(params: {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminOrderRow[]; total: number; page: number; pages: number }> {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  const filter: Record<string, unknown> = {};
  if (params.status && params.status !== "all") filter.status = params.status;
  if (params.q) filter.orderNumber = { $regex: params.q.trim(), $options: "i" };

  const [docs, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("user", "name email")
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    rows: docs.map((o) => toOrderRow(o as unknown as PopulatedOrder)),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type AdminOrderDetail = OrderDTO & {
  customer: { name: string; email: string };
};

export async function getOrderForAdmin(id: string): Promise<AdminOrderDetail | null> {
  await connectDB();
  const doc = await Order.findById(id).populate("user", "name email").lean();
  if (!doc) return null;
  const populated = doc as unknown as PopulatedOrder;
  return {
    ...toOrderDTO(populated),
    customer: {
      name: populated.user?.name ?? "—",
      email: populated.user?.email ?? "—",
    },
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note: string | undefined,
  actor: string
): Promise<AdminOrderDetail | null> {
  await connectDB();
  const order = await Order.findById(id);
  if (!order) return null;

  order.status = status;
  order.timeline.push({
    status,
    note: note?.trim() || `Status set to ${status} by ${actor}.`,
    at: new Date(),
  } as OrderDoc["timeline"][number]);
  await order.save();

  return getOrderForAdmin(id);
}

// ---- products ----------------------------------------------------------

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  status: string;
  brandName: string;
  categoryName: string;
  image: string | null;
  isFeatured: boolean;
  isBestseller: boolean;
};

export async function listAdminProducts(params: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminProductRow[]; total: number; page: number; pages: number }> {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  const filter: Record<string, unknown> = {};
  if (params.status && params.status !== "all") filter.status = params.status;
  if (params.q) filter.name = { $regex: params.q.trim(), $options: "i" };

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("brand", "name")
      .populate("category", "name")
      .lean(),
    Product.countDocuments(filter),
  ]);

  const rows: AdminProductRow[] = docs.map((p) => {
    const brand = p.brand as { name?: string } | null;
    const category = p.category as { name?: string } | null;
    return {
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      mrp: p.mrp,
      stock: p.stock ?? 0,
      status: p.status ?? "active",
      brandName: brand?.name ?? "—",
      categoryName: category?.name ?? "—",
      image: (p.images as string[] | undefined)?.[0] ?? null,
      isFeatured: Boolean(p.isFeatured),
      isBestseller: Boolean(p.isBestseller),
    };
  });

  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type AdminProductForm = AdminProductInput & { id: string };

export async function getProductForAdmin(id: string): Promise<AdminProductForm | null> {
  await connectDB();
  const p = await Product.findById(id).lean();
  if (!p) return null;
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brand: String(p.brand),
    category: String(p.category),
    price: p.price,
    mrp: p.mrp,
    stock: p.stock ?? 0,
    gstPct: p.gstPct ?? 18,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    images: (p.images as string[] | undefined) ?? [],
    goals: (p.goals as string[] | undefined) ?? [],
    tags: (p.tags as string[] | undefined) ?? [],
    status: (p.status as AdminProductInput["status"]) ?? "active",
    isFeatured: Boolean(p.isFeatured),
    isBestseller: Boolean(p.isBestseller),
  };
}

export class AdminError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await Product.findOne({ slug }).select("_id").lean();
  if (existing && String(existing._id) !== excludeId) {
    throw new AdminError("Another product already uses that slug.", 409);
  }
}

export async function createProduct(input: AdminProductInput): Promise<string> {
  await connectDB();
  await assertUniqueSlug(input.slug);
  const doc = await Product.create({
    ...input,
    images: input.images ?? [],
    goals: input.goals ?? [],
    tags: input.tags ?? [],
    stock: input.stock ?? 0,
    gstPct: input.gstPct ?? 18,
    status: input.status ?? "active",
  });
  return String(doc._id);
}

export async function updateProduct(id: string, input: AdminProductInput): Promise<void> {
  await connectDB();
  await assertUniqueSlug(input.slug, id);
  const res = await Product.updateOne(
    { _id: id },
    {
      $set: {
        ...input,
        images: input.images ?? [],
        goals: input.goals ?? [],
        tags: input.tags ?? [],
      },
    }
  );
  if (res.matchedCount === 0) throw new AdminError("Product not found.", 404);
}

export async function setProductStatus(
  id: string,
  status: "draft" | "active" | "archived"
): Promise<void> {
  await connectDB();
  await Product.updateOne({ _id: id }, { $set: { status } });
}

// ---- form option data --------------------------------------------------

export async function getProductFormOptions(): Promise<{
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}> {
  await connectDB();
  const [brands, categories] = await Promise.all([
    Brand.find({}).select("name").sort({ name: 1 }).lean(),
    Category.find({}).select("name").sort({ name: 1 }).lean(),
  ]);
  return {
    brands: brands.map((b) => ({ id: String(b._id), name: b.name })),
    categories: categories.map((c) => ({ id: String(c._id), name: c.name })),
  };
}

// ---- customers (read-only) --------------------------------------------

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orders: number;
  spent: number;
  createdAt: string;
};

export async function listCustomers(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminCustomerRow[]; total: number; page: number; pages: number }> {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  const filter: Record<string, unknown> = { role: "customer" };
  if (params.q) {
    const rx = { $regex: params.q.trim(), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email phone createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Order counts + spend per customer (paid orders only).
  const ids = users.map((u) => u._id);
  const agg = await Order.aggregate<{ _id: unknown; orders: number; spent: number }>([
    { $match: { user: { $in: ids }, "payment.status": "paid" } },
    { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: "$amounts.total" } } },
  ]);
  const byUser = new Map(agg.map((a) => [String(a._id), a]));

  const rows: AdminCustomerRow[] = users.map((u) => {
    const stats = byUser.get(String(u._id));
    return {
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone ?? null,
      orders: stats?.orders ?? 0,
      spent: stats?.spent ?? 0,
      createdAt: new Date(u.createdAt).toISOString(),
    };
  });

  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}
