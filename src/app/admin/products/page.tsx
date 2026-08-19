import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { requirePermission, getCurrentUser } from "@/lib/session";
import { listAdminProducts } from "@/server/services/admin.service";
import { hasPermission, type Role } from "@/server/rbac";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ProductStatusSelect } from "@/components/admin/product-status-select";
import { ProductImage } from "@/components/shop/product-image";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("products:read");
  const user = await getCurrentUser();
  const canWrite = hasPermission(user?.role as Role, "products:write");

  const { page } = await searchParams;
  const { rows, total } = await listAdminProducts({ page: Number(page) || 1, pageSize: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{total} product(s)</p>
        </div>
        {canWrite && (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-1 size-4" /> New product
            </Link>
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Brand / Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canWrite && <th className="px-4 py-3 text-right font-medium">Edit</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      <ProductImage src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p>{p.brandName}</p>
                  <p className="text-xs text-muted-foreground">{p.categoryName}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-semibold">{formatINR(p.price)}</p>
                  {p.mrp > p.price && (
                    <p className="text-xs text-muted-foreground line-through">{formatINR(p.mrp)}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={p.stock <= 5 ? "font-semibold text-destructive" : ""}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {canWrite ? (
                    <ProductStatusSelect productId={p.id} status={p.status} />
                  ) : (
                    <span className="capitalize">{p.status}</span>
                  )}
                </td>
                {canWrite && (
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="inline-flex items-center gap-1 font-medium text-foreground/70 hover:text-foreground hover:underline"
                    >
                      <Pencil className="size-3.5" /> Edit
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
