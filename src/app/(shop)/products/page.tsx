import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { auth } from "@/auth";
import { listProducts, getFacets } from "@/server/services/catalog.service";
import { getWishlistProductIds } from "@/server/services/wishlist.service";
import type { SortValue } from "@/types/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { MobileFilters } from "@/components/shop/mobile-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { Pagination } from "@/components/shop/pagination";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse lab-tested protein, creatine, mass gainers and more from 5XL.",
};

type SP = Record<string, string | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, Number(sp.page)) : 1;

  const [result, facets, session] = await Promise.all([
    listProducts({
      category: sp.category,
      brand: sp.brand,
      goal: sp.goal,
      q: sp.q,
      minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
      sort: sp.sort as SortValue | undefined,
      page,
    }),
    getFacets(),
    auth(),
  ]);

  const wishlistIds = session?.user?.id
    ? new Set(await getWishlistProductIds(session.user.id))
    : new Set<string>();

  const heading = sp.q
    ? `Results for “${sp.q}”`
    : facets.categories.find((c) => c.slug === sp.category)?.name ?? "All Products";

  return (
    <div className="container-5xl py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "product" : "products"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MobileFilters facets={facets} />
          <SortSelect />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr] [&>*]:min-w-0">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <ProductFilters facets={facets} />
          </div>
        </aside>

        {/* Grid */}
        <div>
          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-10" />}
              title="No products found"
              description="Try adjusting or clearing your filters to see more."
              actionLabel="Clear filters"
              actionHref="/products"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {result.items.map((p) => (
                  <ProductCard key={p.id} product={p} inWishlist={wishlistIds.has(p.id)} />
                ))}
              </div>
              <Pagination page={result.page} pages={result.pages} searchParams={sp} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
