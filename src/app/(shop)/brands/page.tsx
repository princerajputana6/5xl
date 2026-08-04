import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listBrands } from "@/server/services/catalog.service";

export const metadata: Metadata = {
  title: "Brands",
  description: "Shop trusted, lab-tested sports nutrition brands at 5XL.",
};

export default async function BrandsPage() {
  const brands = await listBrands();

  return (
    <div className="container-5xl py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Our Brands
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated, authenticity-guaranteed brands trusted by athletes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/products?brand=${b.slug}`}
            className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary"
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
                  {b.name}
                </h2>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {b.productCount} {b.productCount === 1 ? "product" : "products"}
                </span>
              </div>
              {b.description && (
                <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
              )}
            </div>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-foreground">
              Shop {b.name}
              <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
