"use client";

import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/format";

export type VariantDraft = {
  label: string;
  flavour?: string;
  size?: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
};

/** Editor for per-flavour / per-size variants with their own price and stock. */
export function VariantsEditor({
  value,
  onChange,
  fallbackSku,
  fallbackPrice,
  fallbackMrp,
}: {
  value: VariantDraft[];
  onChange: (next: VariantDraft[]) => void;
  fallbackSku?: string;
  fallbackPrice?: number;
  fallbackMrp?: number;
}) {
  const update = (i: number, patch: Partial<VariantDraft>) =>
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  const add = () =>
    onChange([
      ...value,
      {
        label: "",
        flavour: "",
        size: "",
        sku: fallbackSku ? `${fallbackSku}-${value.length + 1}` : "",
        price: fallbackPrice ?? 0,
        mrp: fallbackMrp ?? 0,
        stock: 0,
      },
    ]);

  const totalStock = value.reduce((s, v) => s + (v.stock || 0), 0);

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <Package className="mx-auto size-6 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">No variants</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Leave empty if this product is sold as a single option — the base price and stock
            above will be used.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {value.length} variant{value.length === 1 ? "" : "s"} · {totalStock} units in stock
          </p>

          {value.map((v, i) => (
            <div
              key={i}
              className="relative rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:border-primary/50"
            >
              <button
                type="button"
                aria-label="Remove variant"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>

              <div className="grid gap-3 pr-10 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor={`v-label-${i}`}>Label</Label>
                  <Input
                    id={`v-label-${i}`}
                    value={v.label}
                    placeholder="1kg · Chocolate"
                    onChange={(e) => update(i, { label: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`v-flavour-${i}`}>Flavour</Label>
                  <Input
                    id={`v-flavour-${i}`}
                    value={v.flavour ?? ""}
                    placeholder="Chocolate"
                    onChange={(e) => update(i, { flavour: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`v-size-${i}`}>Size</Label>
                  <Input
                    id={`v-size-${i}`}
                    value={v.size ?? ""}
                    placeholder="1kg"
                    onChange={(e) => update(i, { size: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`v-sku-${i}`}>SKU</Label>
                  <Input
                    id={`v-sku-${i}`}
                    value={v.sku}
                    placeholder="5XL-WHEY-1KG-CHOC"
                    onChange={(e) => update(i, { sku: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`v-price-${i}`}>Price (₹)</Label>
                  <Input
                    id={`v-price-${i}`}
                    type="number"
                    inputMode="numeric"
                    value={v.price}
                    onChange={(e) => update(i, { price: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`v-mrp-${i}`}>MRP (₹)</Label>
                  <Input
                    id={`v-mrp-${i}`}
                    type="number"
                    inputMode="numeric"
                    value={v.mrp}
                    onChange={(e) => update(i, { mrp: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`v-stock-${i}`}>Stock</Label>
                  <Input
                    id={`v-stock-${i}`}
                    type="number"
                    inputMode="numeric"
                    value={v.stock}
                    onChange={(e) => update(i, { stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              {v.mrp > v.price && v.mrp > 0 && (
                <p className="mt-3 text-xs text-success">
                  {Math.round(((v.mrp - v.price) / v.mrp) * 100)}% off · saves{" "}
                  {formatINR(v.mrp - v.price)}
                </p>
              )}
            </div>
          ))}
        </>
      )}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1.5 size-4" />
        Add variant
      </Button>
    </div>
  );
}
