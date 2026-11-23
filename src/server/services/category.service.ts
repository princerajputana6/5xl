import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { categories, products } from "@/server/schema";
import type { AdminCategoryInput } from "@/lib/validators/cms";
import { AdminError } from "@/server/services/admin.service";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  image: string | null;
  emoji: string | null;
  parent: string | null;
  parentName: string | null;
  order: number;
  isActive: boolean;
  productCount: number;
};

export type PublicCategory = {
  name: string;
  slug: string;
  tagline: string | null;
  image: string | null;
  emoji: string | null;
  productCount: number;
};

async function productCountsByCategory(): Promise<Map<string, number>> {
  const agg = await db()
    .select({ categoryId: products.categoryId, n: count() })
    .from(products)
    .where(eq(products.status, "active"))
    .groupBy(products.categoryId)
    .all();
  return new Map(agg.map((a) => [a.categoryId, a.n]));
}

/** Admin: every category with parent name + live product count. */
export async function listCategoriesAdmin(): Promise<CategoryRow[]> {
  const [cats, counts] = await Promise.all([
    db().select().from(categories).orderBy(asc(categories.order), asc(categories.name)).all(),
    productCountsByCategory(),
  ]);
  const nameById = new Map(cats.map((c) => [c.id, c.name]));

  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    tagline: c.tagline ?? null,
    image: c.image ?? null,
    emoji: c.emoji ?? null,
    parent: c.parentId ?? null,
    parentName: c.parentId ? nameById.get(c.parentId) ?? null : null,
    order: c.order ?? 0,
    isActive: c.isActive !== false,
    productCount: counts.get(c.id) ?? 0,
  }));
}

/** Storefront: active categories for the homepage grid + counts. */
export async function listActiveCategories(slugs?: string[]): Promise<PublicCategory[]> {
  const where =
    slugs && slugs.length > 0
      ? and(eq(categories.isActive, true), inArray(categories.slug, slugs))
      : eq(categories.isActive, true);

  const [cats, counts] = await Promise.all([
    db().select().from(categories).where(where).orderBy(asc(categories.order), asc(categories.name)).all(),
    productCountsByCategory(),
  ]);

  const mapped = cats.map((c) => ({
    name: c.name,
    slug: c.slug,
    tagline: c.tagline ?? null,
    image: c.image ?? null,
    emoji: c.emoji ?? null,
    productCount: counts.get(c.id) ?? 0,
  }));

  // Preserve the admin-chosen order when an explicit slug list is given.
  if (slugs && slugs.length > 0) {
    const rank = new Map(slugs.map((s, i) => [s, i]));
    mapped.sort((a, b) => (rank.get(a.slug) ?? 99) - (rank.get(b.slug) ?? 99));
  }
  return mapped;
}

export async function getCategoryAdmin(id: string): Promise<AdminCategoryInput | null> {
  const c = await db().select().from(categories).where(eq(categories.id, id)).get();
  if (!c) return null;
  return {
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    tagline: c.tagline ?? "",
    image: c.image ?? "",
    emoji: c.emoji ?? "",
    parent: c.parentId ?? null,
    order: c.order ?? 0,
    isActive: c.isActive !== false,
    seo: { title: c.seo?.title ?? "", description: c.seo?.description ?? "" },
  };
}

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await db()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .get();
  if (existing && existing.id !== excludeId) {
    throw new AdminError("Another category already uses that slug.", 409);
  }
}

function mapInput(input: AdminCategoryInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description ?? "",
    tagline: input.tagline ?? "",
    image: input.image ?? "",
    emoji: input.emoji ?? "",
    parentId: input.parent || null,
    isActive: input.isActive ?? true,
    seo: { title: input.seo?.title ?? "", description: input.seo?.description ?? "" },
  };
}

export async function createCategory(input: AdminCategoryInput): Promise<string> {
  await assertUniqueSlug(input.slug);
  const last = await db()
    .select({ order: categories.order })
    .from(categories)
    .orderBy(desc(categories.order))
    .get();
  const [row] = await db()
    .insert(categories)
    .values({ ...mapInput(input), order: input.order ?? (last?.order ?? 0) + 1 })
    .returning({ id: categories.id });
  return row.id;
}

export async function updateCategory(id: string, input: AdminCategoryInput): Promise<void> {
  await assertUniqueSlug(input.slug, id);
  if (input.parent && input.parent === id) {
    throw new AdminError("A category cannot be its own parent.", 400);
  }
  const res = await db()
    .update(categories)
    .set({ ...mapInput(input), order: input.order ?? 0 })
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  if (res.length === 0) throw new AdminError("Category not found.", 404);
}

export async function deleteCategory(id: string): Promise<void> {
  const inUse = await db()
    .select({ n: count() })
    .from(products)
    .where(eq(products.categoryId, id))
    .get();
  if ((inUse?.n ?? 0) > 0) {
    throw new AdminError(
      `Can't delete — ${inUse!.n} product${inUse!.n === 1 ? "" : "s"} still use this category.`,
      409
    );
  }
  const children = await db()
    .select({ n: count() })
    .from(categories)
    .where(eq(categories.parentId, id))
    .get();
  if ((children?.n ?? 0) > 0) {
    throw new AdminError("Can't delete — remove or reassign its sub-categories first.", 409);
  }
  await db().delete(categories).where(eq(categories.id, id));
}

export async function reorderCategories(items: { id: string; order: number }[]): Promise<void> {
  for (const it of items) {
    await db().update(categories).set({ order: it.order }).where(eq(categories.id, it.id));
  }
}
