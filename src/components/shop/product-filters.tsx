"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { FacetDTO } from "@/types/catalog";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const GOALS = [
  { slug: "muscle", label: "Build Muscle" },
  { slug: "fat-loss", label: "Lose Fat" },
  { slug: "performance", label: "Performance" },
  { slug: "wellness", label: "Wellness" },
];

export function ProductFilters({
  facets,
  onNavigate,
}: {
  facets: FacetDTO;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value == null || next.get(key) === value) next.delete(key);
      else next.set(key, value);
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
      onNavigate?.();
    },
    [params, pathname, router, onNavigate]
  );

  const setPrice = React.useCallback(
    (min: number, max: number) => {
      const next = new URLSearchParams(params.toString());
      next.set("minPrice", String(min));
      next.set("maxPrice", String(max));
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
      onNavigate?.();
    },
    [params, pathname, router, onNavigate]
  );

  const activeCategory = params.get("category");
  const activeBrand = params.get("brand");
  const activeGoal = params.get("goal");
  const activeMin = params.get("minPrice");

  const priceBuckets = buildPriceBuckets(facets.priceRange.min, facets.priceRange.max);

  return (
    <div className="space-y-6">
      <FilterSection title="Category">
        {facets.categories.map((c) => (
          <FilterRow
            key={c.slug}
            active={activeCategory === c.slug}
            onClick={() => setParam("category", c.slug)}
          >
            <span>{c.emoji ? `${c.emoji} ` : ""}{c.name}</span>
          </FilterRow>
        ))}
      </FilterSection>

      <FilterSection title="Goal">
        {GOALS.map((g) => (
          <FilterRow
            key={g.slug}
            active={activeGoal === g.slug}
            onClick={() => setParam("goal", g.slug)}
          >
            {g.label}
          </FilterRow>
        ))}
      </FilterSection>

      <FilterSection title="Brand">
        {facets.brands.map((b) => (
          <FilterRow
            key={b.slug}
            active={activeBrand === b.slug}
            onClick={() => setParam("brand", b.slug)}
          >
            {b.name}
          </FilterRow>
        ))}
      </FilterSection>

      <FilterSection title="Price">
        {priceBuckets.map((b) => (
          <FilterRow
            key={b.label}
            active={activeMin === String(b.min)}
            onClick={() => setPrice(b.min, b.max)}
          >
            {b.label}
          </FilterRow>
        ))}
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">{title}</h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function FilterRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
        active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground"
      )}
    >
      <span>{children}</span>
      {active && <X className="size-3.5" />}
    </button>
  );
}

function buildPriceBuckets(min: number, max: number) {
  const floor = Math.floor(min / 500) * 500;
  const ceil = Math.ceil(max / 500) * 500;
  return [
    { label: `Under ${formatINR(1000)}`, min: 0, max: 1000 },
    { label: `${formatINR(1000)} – ${formatINR(2000)}`, min: 1000, max: 2000 },
    { label: `${formatINR(2000)} – ${formatINR(3500)}`, min: 2000, max: 3500 },
    { label: `Over ${formatINR(3500)}`, min: 3500, max: ceil + 1000 },
  ].filter((b) => b.max > floor);
}
