import { and, asc, count, desc, eq, gt, inArray, like, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { orders, products, users, brands, categories } from "@/server/schema";
import { toOrderDTO, type OrderRecord } from "@/server/services/order.service";
import type { OrderDTO, OrderStatus } from "@/types/order";
import type { AdminProductInput } from "@/lib/validators/admin";
import type { ProductVariant } from "@/server/schema";

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
  const [rev, totalOrders, pendingOrders, productCount, customers, lowStock, recent] =
    await Promise.all([
      db()
        .select({ revenue: sql<number>`coalesce(sum(${orders.total}), 0)`, count: count() })
        .from(orders)
        .where(eq(orders.paymentStatus, "paid"))
        .get(),
      db().select({ n: count() }).from(orders).get(),
      db().select({ n: count() }).from(orders).where(eq(orders.status, "pending")).get(),
      db().select({ n: count() }).from(products).get(),
      db().select({ n: count() }).from(users).where(eq(users.role, "customer")).get(),
      db().select({ n: count() }).from(products).where(lte(products.stock, 5)).get(),
      orderRowQuery().orderBy(desc(orders.createdAt)).limit(6).all(),
    ]);

  return {
    revenue: rev?.revenue ?? 0,
    paidOrders: rev?.count ?? 0,
    totalOrders: totalOrders?.n ?? 0,
    pendingOrders: pendingOrders?.n ?? 0,
    products: productCount?.n ?? 0,
    customers: customers?.n ?? 0,
    lowStock: lowStock?.n ?? 0,
    recentOrders: (recent as OrderJoinRow[]).map(toOrderRow),
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

type OrderJoinRow = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: OrderRecord["items"];
  placedAt: Date;
  createdAt: Date;
  customerName: string | null;
  customerEmail: string | null;
};

/** Order-list SELECT joined to the customer (name + email). */
function orderRowQuery() {
  return db()
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      items: orders.items,
      placedAt: orders.placedAt,
      createdAt: orders.createdAt,
      customerName: users.name,
      customerEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id));
}

function toOrderRow(o: OrderJoinRow): AdminOrderRow {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName ?? "—",
    customerEmail: o.customerEmail ?? "—",
    total: o.total ?? 0,
    status: o.status as OrderStatus,
    paymentStatus: o.paymentStatus ?? "created",
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
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  const conds = [];
  if (params.status && params.status !== "all") conds.push(eq(orders.status, params.status));
  if (params.q) conds.push(like(orders.orderNumber, `%${params.q.trim()}%`));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, totalRow] = await Promise.all([
    orderRowQuery()
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all(),
    db().select({ n: count() }).from(orders).where(where).get(),
  ]);

  const total = totalRow?.n ?? 0;
  return {
    rows: (rows as OrderJoinRow[]).map(toOrderRow),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type AdminOrderDetail = OrderDTO & {
  customer: { name: string; email: string };
};

export async function getOrderForAdmin(id: string): Promise<AdminOrderDetail | null> {
  const order = await db().select().from(orders).where(eq(orders.id, id)).get();
  if (!order) return null;
  const customer = await db()
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, order.userId))
    .get();
  return {
    ...toOrderDTO(order),
    customer: {
      name: customer?.name ?? "—",
      email: customer?.email ?? "—",
    },
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note: string | undefined,
  actor: string
): Promise<AdminOrderDetail | null> {
  const order = await db().select().from(orders).where(eq(orders.id, id)).get();
  if (!order) return null;

  const timeline = [
    ...(order.timeline ?? []),
    {
      status,
      note: note?.trim() || `Status set to ${status} by ${actor}.`,
      at: Date.now(),
    },
  ];
  await db().update(orders).set({ status, timeline }).where(eq(orders.id, id));

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

/** Stock buckets offered as quick filters in the admin list. */
export const STOCK_FILTERS = ["all", "out", "low", "in"] as const;
export type StockFilter = (typeof STOCK_FILTERS)[number];

/** Threshold below which stock is flagged as "low" (0 excluded — that's "out"). */
export const LOW_STOCK_THRESHOLD = 5;

export const PRODUCT_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "name-asc": { name: 1 },
  "name-desc": { name: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "stock-asc": { stock: 1 },
  "stock-desc": { stock: -1 },
} as const;

export type ProductSort = keyof typeof PRODUCT_SORTS;

function productOrderBy(sort: ProductSort) {
  switch (sort) {
    case "oldest":
      return [asc(products.createdAt)];
    case "name-asc":
      return [asc(products.name)];
    case "name-desc":
      return [desc(products.name)];
    case "price-asc":
      return [asc(products.price)];
    case "price-desc":
      return [desc(products.price)];
    case "stock-asc":
      return [asc(products.stock)];
    case "stock-desc":
      return [desc(products.stock)];
    default:
      return [desc(products.createdAt)];
  }
}

export async function listAdminProducts(params: {
  q?: string;
  status?: string;
  stock?: string;
  brand?: string;
  category?: string;
  flag?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminProductRow[]; total: number; page: number; pages: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  const conds = [];
  if (params.status && params.status !== "all") conds.push(eq(products.status, params.status));
  if (params.q) {
    const term = `%${params.q.trim()}%`;
    conds.push(or(like(products.name, term), like(products.sku, term))!);
  }
  if (params.stock === "out") conds.push(lte(products.stock, 0));
  else if (params.stock === "low")
    conds.push(and(gt(products.stock, 0), lte(products.stock, LOW_STOCK_THRESHOLD))!);
  else if (params.stock === "in") conds.push(gt(products.stock, LOW_STOCK_THRESHOLD));
  if (params.brand && params.brand !== "all") conds.push(eq(products.brandId, params.brand));
  if (params.category && params.category !== "all")
    conds.push(eq(products.categoryId, params.category));
  if (params.flag === "featured") conds.push(eq(products.isFeatured, true));
  else if (params.flag === "bestseller") conds.push(eq(products.isBestseller, true));
  else if (params.flag === "no-image") conds.push(sql`json_array_length(${products.images}) = 0`);

  const where = conds.length ? and(...conds) : undefined;
  const sortKey = (params.sort ?? "newest") as ProductSort;

  const [rows, totalRow] = await Promise.all([
    db()
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        price: products.price,
        mrp: products.mrp,
        stock: products.stock,
        status: products.status,
        images: products.images,
        isFeatured: products.isFeatured,
        isBestseller: products.isBestseller,
        brandName: brands.name,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(...productOrderBy(sortKey))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all(),
    db().select({ n: count() }).from(products).where(where).get(),
  ]);

  const total = totalRow?.n ?? 0;
  const mapped: AdminProductRow[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price,
    mrp: p.mrp,
    stock: p.stock ?? 0,
    status: p.status ?? "active",
    brandName: p.brandName ?? "—",
    categoryName: p.categoryName ?? "—",
    image: (p.images as string[] | null)?.[0] ?? null,
    isFeatured: Boolean(p.isFeatured),
    isBestseller: Boolean(p.isBestseller),
  }));

  return { rows: mapped, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type AdminProductForm = AdminProductInput & { id: string };

export async function getProductForAdmin(id: string): Promise<AdminProductForm | null> {
  const p = await db().select().from(products).where(eq(products.id, id)).get();
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brand: p.brandId,
    category: p.categoryId,
    price: p.price,
    mrp: p.mrp,
    stock: p.stock ?? 0,
    gstPct: p.gstPct ?? 18,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    images: p.images ?? [],
    goals: p.goals ?? [],
    tags: p.tags ?? [],
    status: (p.status as AdminProductInput["status"]) ?? "active",
    isFeatured: Boolean(p.isFeatured),
    isBestseller: Boolean(p.isBestseller),
    benefits: p.benefits ?? [],
    keyBenefits: (p.keyBenefits ?? []).map((k) => ({
      title: k.title ?? "",
      description: k.description ?? "",
      icon: k.icon ?? "",
      images: k.images ?? [],
    })),
    frequentlyBoughtWith: p.frequentlyBoughtWith ?? [],
    ingredients: p.ingredients ?? [],
    usage: p.usage ?? "",
    nutritionFacts: (p.nutritionFacts ?? []).map((n) => ({ label: n.label, value: n.value })),
    variants: (p.variants ?? []).map((v) => ({
      label: v.label,
      flavour: v.flavour ?? undefined,
      size: v.size ?? undefined,
      sku: v.sku,
      price: v.price,
      mrp: v.mrp,
      stock: v.stock ?? 0,
    })),
    seo: {
      title: p.seo?.title ?? "",
      description: p.seo?.description ?? "",
    },
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
  const existing = await db()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .get();
  if (existing && existing.id !== excludeId) {
    throw new AdminError("Another product already uses that slug.", 409);
  }
}

/** Map validated admin form input → a product row insert/update payload. */
function mapProductInput(input: AdminProductInput) {
  const variants: ProductVariant[] = (input.variants ?? []).map((v) => ({
    id: crypto.randomUUID(),
    label: v.label,
    flavour: v.flavour,
    size: v.size,
    sku: v.sku,
    price: v.price,
    mrp: v.mrp,
    stock: v.stock ?? 0,
  }));
  return {
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    brandId: input.brand,
    categoryId: input.category,
    price: input.price,
    mrp: input.mrp,
    stock: input.stock ?? 0,
    gstPct: input.gstPct ?? 18,
    shortDescription: input.shortDescription ?? "",
    description: input.description ?? "",
    images: input.images ?? [],
    goals: input.goals ?? [],
    tags: input.tags ?? [],
    status: input.status ?? "active",
    isFeatured: input.isFeatured ?? false,
    isBestseller: input.isBestseller ?? false,
    benefits: input.benefits ?? [],
    keyBenefits: (input.keyBenefits ?? []).map((k) => ({
      title: k.title,
      description: k.description ?? "",
      icon: k.icon ?? "",
      images: k.images ?? [],
    })),
    frequentlyBoughtWith: input.frequentlyBoughtWith ?? [],
    ingredients: input.ingredients ?? [],
    usage: input.usage ?? "",
    nutritionFacts: (input.nutritionFacts ?? []).map((n) => ({ label: n.label, value: n.value })),
    variants,
    seo: { title: input.seo?.title ?? "", description: input.seo?.description ?? "" },
  };
}

export async function createProduct(input: AdminProductInput): Promise<string> {
  await assertUniqueSlug(input.slug);
  const [row] = await db()
    .insert(products)
    .values(mapProductInput(input))
    .returning({ id: products.id });
  return row.id;
}

export async function updateProduct(id: string, input: AdminProductInput): Promise<void> {
  await assertUniqueSlug(input.slug, id);
  const res = await db()
    .update(products)
    .set(mapProductInput(input))
    .where(eq(products.id, id))
    .returning({ id: products.id });
  if (res.length === 0) throw new AdminError("Product not found.", 404);
}

export async function setProductStatus(
  id: string,
  status: "draft" | "active" | "archived"
): Promise<void> {
  await db().update(products).set({ status }).where(eq(products.id, id));
}

// ---- form option data --------------------------------------------------

export async function getProductFormOptions(): Promise<{
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}> {
  const [brs, cats] = await Promise.all([
    db().select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name)).all(),
    db()
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.name))
      .all(),
  ]);
  return { brands: brs, categories: cats };
}

/** Counts behind the admin list's quick filters. */
export async function getProductStockSummary(): Promise<{
  all: number;
  out: number;
  low: number;
  in: number;
  noImage: number;
}> {
  const [all, out, low, inStock, noImage] = await Promise.all([
    db().select({ n: count() }).from(products).get(),
    db().select({ n: count() }).from(products).where(lte(products.stock, 0)).get(),
    db()
      .select({ n: count() })
      .from(products)
      .where(and(gt(products.stock, 0), lte(products.stock, LOW_STOCK_THRESHOLD)))
      .get(),
    db().select({ n: count() }).from(products).where(gt(products.stock, LOW_STOCK_THRESHOLD)).get(),
    db()
      .select({ n: count() })
      .from(products)
      .where(sql`json_array_length(${products.images}) = 0`)
      .get(),
  ]);
  return {
    all: all?.n ?? 0,
    out: out?.n ?? 0,
    low: low?.n ?? 0,
    in: inStock?.n ?? 0,
    noImage: noImage?.n ?? 0,
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
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  const conds = [eq(users.role, "customer")];
  if (params.q) {
    const term = `%${params.q.trim()}%`;
    conds.push(or(like(users.name, term), like(users.email, term))!);
  }
  const where = and(...conds);

  const [rows, totalRow] = await Promise.all([
    db()
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all(),
    db().select({ n: count() }).from(users).where(where).get(),
  ]);

  // Order counts + spend per customer (paid orders only).
  const ids = rows.map((u) => u.id);
  const agg = ids.length
    ? await db()
        .select({
          userId: orders.userId,
          orders: count(),
          spent: sql<number>`coalesce(sum(${orders.total}), 0)`,
        })
        .from(orders)
        .where(and(eq(orders.paymentStatus, "paid"), inArray(orders.userId, ids)))
        .groupBy(orders.userId)
        .all()
    : [];
  const byUser = new Map(agg.map((a) => [a.userId, a]));

  const total = totalRow?.n ?? 0;
  const mapped: AdminCustomerRow[] = rows.map((u) => {
    const stats = byUser.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? null,
      orders: stats?.orders ?? 0,
      spent: stats?.spent ?? 0,
      createdAt: new Date(u.createdAt).toISOString(),
    };
  });

  return { rows: mapped, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}
