"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

export type StockSummary = { all: number; out: number; low: number; in: number; noImage: number };

const STATUSES = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "stock-asc", label: "Stock: low to high" },
  { value: "stock-desc", label: "Stock: high to low" },
];

const FLAGS = [
  { value: "all", label: "Any" },
  { value: "featured", label: "Featured" },
  { value: "bestseller", label: "Bestseller" },
  { value: "no-image", label: "Missing photos" },
];

/** Search, quick stock buckets, faceted filters and sorting — all URL-driven. */
export function ProductFilters({
  brands,
  categories,
  summary,
}: {
  brands: Option[];
  categories: Option[];
  summary: StockSummary;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const get = (key: string, fallback = "all") => params.get(key) ?? fallback;

  const currentQ = params.get("q") ?? "";
  const [q, setQ] = React.useState(currentQ);

  // Keep the box in step when the URL changes from elsewhere (back button…).
  const [syncedQ, setSyncedQ] = React.useState(currentQ);
  if (currentQ !== syncedQ) {
    setSyncedQ(currentQ);
    setQ(currentQ);
  }

  const activeCount = ["status", "stock", "brand", "category", "flag"].filter(
    (k) => params.get(k) && params.get(k) !== "all"
  ).length;

  function apply(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all" || (key === "sort" && value === "newest")) sp.delete(key);
      else sp.set(key, value);
    }
    sp.delete("page"); // a new filter always starts from the first page
    router.push(`/admin/products${sp.toString() ? `?${sp}` : ""}`);
  }

  const stockBuckets = [
    { value: "all", label: "All", count: summary.all, tone: "" },
    { value: "out", label: "Out of stock", count: summary.out, tone: "text-destructive" },
    {
      value: "low",
      label: `Low (≤5)`,
      count: summary.low,
      tone: "text-amber-600 dark:text-amber-400",
    },
    { value: "in", label: "In stock", count: summary.in, tone: "text-success" },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {/* Row 1 — search + sort */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q });
          }}
          className="relative flex-1 sm:max-w-xs"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or SKU…"
            className="pl-9 pr-9"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQ("");
                apply({ q: "" });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="size-4 shrink-0 text-muted-foreground" />
          <Select value={get("sort", "newest")} onValueChange={(v) => apply({ sort: v })}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2 — stock buckets */}
      <div className="flex flex-wrap gap-2">
        {stockBuckets.map((b) => {
          const active = get("stock") === b.value;
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => apply({ stock: b.value })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/60 hover:bg-accent"
              )}
            >
              {b.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[0.65rem] font-bold",
                  active ? "bg-primary-foreground/20" : cn("bg-muted", b.tone)
                )}
              >
                {b.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Row 3 — faceted selects */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[0.65rem] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>

        <div className="flex rounded-md border border-border p-0.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => apply({ status: s.value })}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                get("status") === s.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Select value={get("brand")} onValueChange={(v) => apply({ brand: v })}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={get("category")} onValueChange={(v) => apply({ category: v })}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={get("flag")} onValueChange={(v) => apply({ flag: v })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Highlight" />
          </SelectTrigger>
          <SelectContent>
            {FLAGS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
                {f.value === "no-image" && summary.noImage > 0 && ` (${summary.noImage})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(activeCount > 0 || currentQ) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/products")}
          >
            <X className="mr-1 size-3.5" /> Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
