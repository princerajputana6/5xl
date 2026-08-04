import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { getProductFormOptions, getProductForAdmin } from "@/server/services/admin.service";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("products:write");
  const { id } = await params;
  const [{ brands, categories }, product] = await Promise.all([
    getProductFormOptions(),
    getProductForAdmin(id),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Edit · {product.name}
      </h1>
      <ProductForm brands={brands} categories={categories} initial={product} />
    </div>
  );
}
