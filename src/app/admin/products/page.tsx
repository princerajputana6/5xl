import Link from "next/link";
import { Plus, Pencil, PackageSearch, Star, Flame } from "lucide-react";
import { requirePermission, getCurrentUser } from "@/lib/session";
import {
  listAdminProducts,
  getProductStockSummary,
  getProductFormOptions,
} from "@/server/services/admin.service";
import { hasPermission, type Role } from "@/server/rbac";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ProductStatusSelect } from "@/components/admin/product-status-select";
import { ProductFilters } from "@/components/admin/product-filters";
import { ProductImage } from "@/components/shop/product-image";
import { cn } from "@/lib/utils";

export const metadata = { title: "Products" };

const PAGE_SIZE = 50;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    stock?: string;
    brand?: string;
    category?: string;
    flag?: string;
    sort?: string;
  }>;
}) {
  await requirePermission("products:read");
  const user = await getCurrentUser();
  const canWrite = hasPermission(user?.role as Role, "products:write");

  const sp = await searchParams;
  const { page, q, status, stock, brand, category, flag, sort } = sp;

  const [{ rows, total, page: current, pages }, summary, { brands, categories }] =
    await Promise.all([
      listAdminProducts({
        page: Number(page) || 1,
        pageSize: PAGE_SIZE,
        q,
        status,
        stock,
        brand,
        category,
        flag,
        sort,
      }),
      getProductStockSummary(),
      getProductFormOptions(),
    ]);

  const filtered = Boolean(
    q ||
      [status, stock, brand, category, flag].some((v) => v && v !== "all")
  );

  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries({ q, status, stock, brand, category, flag, sort })) {
      if (value && value !== "all") qs.set(key, value);
    }
    if (n > 1) qs.set("page", String(n));
    return `/admin/products${qs.toString() ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
            Products
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} product{total === 1 ? "" : "s"}
            {summary.out > 0 && (
              <>
                {" · "}
                <span className="font-medium text-destructive">{summary.out} out of stock</span>
              </>
            )}
            {summary.low > 0 && (
              <>
                {" · "}
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {summary.low} low on stock
                </span>
              </>
            )}
          </p>
        </div>

        {canWrite && (
          <Button asChild className="transition-transform active:scale-95">
            <Link href="/admin/products/new">
              <Plus className="mr-1 size-4" /> New product
            </Link>
          </Button>
        )}
      </div>

      <ProductFilters brands={brands} categories={categories} summary={summary} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <PackageSearch className="mx-auto size-9 text-muted-foreground/50" />
          <p className="mt-3 font-medium">No products found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered
              ? "Try a different search term or status filter."
              : "Create your first product to get started."}
          </p>
          {canWrite && !filtered && (
            <Button asChild className="mt-5">
              <Link href="/admin/products/new">
                <Plus className="mr-1 size-4" /> New product
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[880px] text-sm">
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
                  <tr key={p.id} className="group transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          <ProductImage
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="44px"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium">
                            <span className="line-clamp-1">{p.name}</span>
                            {p.isFeatured && (
                              <Star
                                className="size-3.5 shrink-0 fill-primary text-primary"
                                aria-label="Featured"
                              />
                            )}
                            {p.isBestseller && (
                              <Flame
                                className="size-3.5 shrink-0 text-orange-500"
                                aria-label="Bestseller"
                              />
                            )}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
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
                        <p className="text-xs text-muted-foreground line-through">
                          {formatINR(p.mrp)}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                          p.stock === 0
                            ? "bg-destructive/10 text-destructive"
                            : p.stock <= 5
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
                              : "text-muted-foreground"
                        )}
                      >
                        {p.stock === 0 ? "Out" : p.stock}
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
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
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

          {pages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {current} of {pages}
              </p>
              <div className="flex gap-2">
                <Button
                  asChild={current > 1}
                  variant="outline"
                  size="sm"
                  disabled={current <= 1}
                >
                  {current > 1 ? <Link href={pageHref(current - 1)}>Previous</Link> : <span>Previous</span>}
                </Button>
                <Button
                  asChild={current < pages}
                  variant="outline"
                  size="sm"
                  disabled={current >= pages}
                >
                  {current < pages ? <Link href={pageHref(current + 1)}>Next</Link> : <span>Next</span>}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
