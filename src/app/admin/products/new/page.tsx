import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { getProductFormOptions } from "@/server/services/admin.service";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requirePermission("products:write");
  const { brands, categories } = await getProductFormOptions();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">New product</h1>
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
