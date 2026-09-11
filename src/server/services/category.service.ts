import { connectDB } from "@/server/db";
import { Category } from "@/server/models/Category";
import { Product } from "@/server/models/Product";
import type { AdminCategoryInput } from "@/lib/validators/cms";
import { AdminError } from "@/server/services/admin.service";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  image: string | null;
  emoji: string | null;
  productCount: number;
};

async function productCountsByCategory(): Promise<Map<string, number>> {
  const agg = await Product.aggregate<{ _id: unknown; n: number }>([
    { $match: { status: "active" } },
    { $group: { _id: "$category", n: { $sum: 1 } } },
  ]);
  return new Map(agg.map((a) => [String(a._id), a.n]));
}

/** Admin: every category with parent name + live product count. */
export async function listCategoriesAdmin(): Promise<CategoryRow[]> {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find({}).sort({ order: 1, name: 1 }).lean(),
    productCountsByCategory(),
  ]);
  const nameById = new Map(cats.map((c) => [String(c._id), c.name]));

  return cats.map((c) => ({
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    image: c.image ?? null,
    emoji: c.emoji ?? null,
    parent: c.parent ? String(c.parent) : null,
    parentName: c.parent ? nameById.get(String(c.parent)) ?? null : null,
    order: c.order ?? 0,
    isActive: c.isActive !== false,
    productCount: counts.get(String(c._id)) ?? 0,
  }));
}

/** Storefront: active categories for the homepage grid + counts. */
export async function listActiveCategories(slugs?: string[]): Promise<PublicCategory[]> {
  await connectDB();
  const filter: Record<string, unknown> = { isActive: true };
  if (slugs && slugs.length > 0) filter.slug = { $in: slugs };

  const [cats, counts] = await Promise.all([
    Category.find(filter).sort({ order: 1, name: 1 }).lean(),
    productCountsByCategory(),
  ]);

  const mapped = cats.map((c) => ({
    name: c.name,
    slug: c.slug,
    image: c.image ?? null,
    emoji: c.emoji ?? null,
    productCount: counts.get(String(c._id)) ?? 0,
  }));

  // Preserve the admin-chosen order when an explicit slug list is given.
  if (slugs && slugs.length > 0) {
    const rank = new Map(slugs.map((s, i) => [s, i]));
    mapped.sort((a, b) => (rank.get(a.slug) ?? 99) - (rank.get(b.slug) ?? 99));
  }
  return mapped;
}

export async function getCategoryAdmin(id: string): Promise<AdminCategoryInput | null> {
  await connectDB();
  const c = await Category.findById(id).lean();
  if (!c) return null;
  return {
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    image: c.image ?? "",
    emoji: c.emoji ?? "",
    parent: c.parent ? String(c.parent) : null,
    order: c.order ?? 0,
    isActive: c.isActive !== false,
    seo: { title: c.seo?.title ?? "", description: c.seo?.description ?? "" },
  };
}

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await Category.findOne({ slug }).select("_id").lean();
  if (existing && String(existing._id) !== excludeId) {
    throw new AdminError("Another category already uses that slug.", 409);
  }
}

export async function createCategory(input: AdminCategoryInput): Promise<string> {
  await connectDB();
  await assertUniqueSlug(input.slug);
  const last = await Category.findOne({}).sort({ order: -1 }).select("order").lean();
  const doc = await Category.create({
    ...input,
    parent: input.parent || null,
    order: input.order ?? (last?.order ?? 0) + 1,
    isActive: input.isActive ?? true,
  });
  return String(doc._id);
}

export async function updateCategory(id: string, input: AdminCategoryInput): Promise<void> {
  await connectDB();
  await assertUniqueSlug(input.slug, id);
  if (input.parent && input.parent === id) {
    throw new AdminError("A category cannot be its own parent.", 400);
  }
  const res = await Category.updateOne(
    { _id: id },
    { $set: { ...input, parent: input.parent || null } }
  );
  if (res.matchedCount === 0) throw new AdminError("Category not found.", 404);
}

export async function deleteCategory(id: string): Promise<void> {
  await connectDB();
  const inUse = await Product.countDocuments({ category: id });
  if (inUse > 0) {
    throw new AdminError(
      `Can't delete — ${inUse} product${inUse === 1 ? "" : "s"} still use this category.`,
      409
    );
  }
  const hasChildren = await Category.countDocuments({ parent: id });
  if (hasChildren > 0) {
    throw new AdminError("Can't delete — remove or reassign its sub-categories first.", 409);
  }
  await Category.deleteOne({ _id: id });
}

export async function reorderCategories(items: { id: string; order: number }[]): Promise<void> {
  await connectDB();
  await Category.bulkWrite(
    items.map((it) => ({ updateOne: { filter: { _id: it.id }, update: { $set: { order: it.order } } } }))
  );
}
