import { connectDB } from "@/server/db";
import { Brand } from "@/server/models/Brand";
import { Product } from "@/server/models/Product";
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
  const agg = await Product.aggregate<{ _id: unknown; n: number }>([
    { $match: { status: "active" } },
    { $group: { _id: "$brand", n: { $sum: 1 } } },
  ]);
  return new Map(agg.map((a) => [String(a._id), a.n]));
}

export async function listBrandsAdmin(): Promise<BrandRow[]> {
  await connectDB();
  const [brands, counts] = await Promise.all([
    Brand.find({}).sort({ name: 1 }).lean(),
    productCountsByBrand(),
  ]);
  return brands.map((b) => ({
    id: String(b._id),
    name: b.name,
    slug: b.slug,
    description: b.description ?? null,
    logo: b.logo ?? null,
    isActive: b.isActive !== false,
    productCount: counts.get(String(b._id)) ?? 0,
  }));
}

export async function getBrandAdmin(id: string): Promise<AdminBrandInput | null> {
  await connectDB();
  const b = await Brand.findById(id).lean();
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
  const existing = await Brand.findOne({ slug }).select("_id").lean();
  if (existing && String(existing._id) !== excludeId) {
    throw new AdminError("Another brand already uses that slug.", 409);
  }
}

export async function createBrand(input: AdminBrandInput): Promise<string> {
  await connectDB();
  await assertUniqueSlug(input.slug);
  const doc = await Brand.create({ ...input, isActive: input.isActive ?? true });
  return String(doc._id);
}

export async function updateBrand(id: string, input: AdminBrandInput): Promise<void> {
  await connectDB();
  await assertUniqueSlug(input.slug, id);
  const res = await Brand.updateOne({ _id: id }, { $set: input });
  if (res.matchedCount === 0) throw new AdminError("Brand not found.", 404);
}

export async function deleteBrand(id: string): Promise<void> {
  await connectDB();
  const inUse = await Product.countDocuments({ brand: id });
  if (inUse > 0) {
    throw new AdminError(
      `Can't delete — ${inUse} product${inUse === 1 ? "" : "s"} still use this brand.`,
      409
    );
  }
  await Brand.deleteOne({ _id: id });
}
