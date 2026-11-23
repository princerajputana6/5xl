import { asc, count, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { brands, products } from "@/server/schema";
import type { AdminBrandInput } from "@/lib/validators/cms";
import { AdminError } from "@/server/services/admin.service";

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  productCount: number;
};

async function productCountsByBrand(): Promise<Map<string, number>> {
  const agg = await db()
    .select({ brandId: products.brandId, n: count() })
    .from(products)
    .where(eq(products.status, "active"))
    .groupBy(products.brandId)
    .all();
  return new Map(agg.map((a) => [a.brandId, a.n]));
}

export async function listBrandsAdmin(): Promise<BrandRow[]> {
  const [brs, counts] = await Promise.all([
    db().select().from(brands).orderBy(asc(brands.name)).all(),
    productCountsByBrand(),
  ]);
  return brs.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description ?? null,
    logo: b.logo ?? null,
    isActive: b.isActive !== false,
    productCount: counts.get(b.id) ?? 0,
  }));
}

export async function getBrandAdmin(id: string): Promise<AdminBrandInput | null> {
  const b = await db().select().from(brands).where(eq(brands.id, id)).get();
  if (!b) return null;
  return {
    name: b.name,
    slug: b.slug,
    description: b.description ?? "",
    logo: b.logo ?? "",
    isActive: b.isActive !== false,
    seo: { title: b.seo?.title ?? "", description: b.seo?.description ?? "" },
  };
}

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await db().select({ id: brands.id }).from(brands).where(eq(brands.slug, slug)).get();
  if (existing && existing.id !== excludeId) {
    throw new AdminError("Another brand already uses that slug.", 409);
  }
}

function mapInput(input: AdminBrandInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description ?? "",
    logo: input.logo ?? "",
    isActive: input.isActive ?? true,
    seo: { title: input.seo?.title ?? "", description: input.seo?.description ?? "" },
  };
}

export async function createBrand(input: AdminBrandInput): Promise<string> {
  await assertUniqueSlug(input.slug);
  const [row] = await db().insert(brands).values(mapInput(input)).returning({ id: brands.id });
  return row.id;
}

export async function updateBrand(id: string, input: AdminBrandInput): Promise<void> {
  await assertUniqueSlug(input.slug, id);
  const res = await db()
    .update(brands)
    .set(mapInput(input))
    .where(eq(brands.id, id))
    .returning({ id: brands.id });
  if (res.length === 0) throw new AdminError("Brand not found.", 404);
}

export async function deleteBrand(id: string): Promise<void> {
  const inUse = await db().select({ n: count() }).from(products).where(eq(products.brandId, id)).get();
  if ((inUse?.n ?? 0) > 0) {
    throw new AdminError(
      `Can't delete — ${inUse!.n} product${inUse!.n === 1 ? "" : "s"} still use this brand.`,
      409
    );
  }
  await db().delete(brands).where(eq(brands.id, id));
}
