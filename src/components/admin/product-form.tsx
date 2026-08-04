"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import type { AdminProductForm } from "@/server/services/admin.service";

type Option = { id: string; name: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function ProductForm({
  brands,
  categories,
  initial,
}: {
  brands: Option[];
  categories: Option[];
  initial?: AdminProductForm;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [pending, setPending] = React.useState(false);

  const [form, setForm] = React.useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    sku: initial?.sku ?? "",
    brand: initial?.brand ?? "",
    category: initial?.category ?? "",
    price: initial?.price?.toString() ?? "",
    mrp: initial?.mrp?.toString() ?? "",
    stock: initial?.stock?.toString() ?? "0",
    gstPct: initial?.gstPct?.toString() ?? "18",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    goals: (initial?.goals ?? []).join(", "),
    tags: (initial?.tags ?? []).join(", "),
    status: initial?.status ?? "active",
    isFeatured: initial?.isFeatured ?? false,
    isBestseller: initial?.isBestseller ?? false,
  });

  const [images, setImages] = React.useState<string[]>(initial?.images ?? []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const csv = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      sku: form.sku,
      brand: form.brand,
      category: form.category,
      price: Number(form.price),
      mrp: Number(form.mrp),
      stock: Number(form.stock),
      gstPct: Number(form.gstPct),
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      images,
      goals: csv(form.goals),
      tags: csv(form.tags),
      status: form.status,
      isFeatured: form.isFeatured,
      isBestseller: form.isBestseller,
    };

    const res = await fetch(
      editing ? `/api/admin/products/${initial!.id}` : "/api/admin/products",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not save product.");
      return;
    }
    toast.success(editing ? "Product updated." : "Product created.");
    router.push("/admin/products");
    router.refresh();
  }

  const text = (
    key: keyof typeof form,
    label: string,
    props: React.ComponentProps<typeof Input> = {}
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={String(form[key])}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 rounded-xl border border-border p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          {text("name", "Name", {
            placeholder: "Gold Whey Isolate",
            onBlur: () => !form.slug && set("slug", slugify(form.name)),
          })}
        </div>
        {text("slug", "Slug", { placeholder: "gold-whey-isolate" })}
        {text("sku", "SKU", { placeholder: "5XL-WHEY-1KG" })}

        <div className="space-y-1.5">
          <Label>Brand</Label>
          <Select value={form.brand} onValueChange={(v) => set("brand", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {text("price", "Price (₹)", { type: "number", inputMode: "numeric" })}
        {text("mrp", "MRP (₹)", { type: "number", inputMode: "numeric" })}
        {text("stock", "Stock", { type: "number", inputMode: "numeric" })}
        {text("gstPct", "GST %", { type: "number", inputMode: "numeric" })}
      </div>

      <div className="grid gap-4 rounded-xl border border-border p-6">
        {text("shortDescription", "Short description", {
          placeholder: "One-line summary shown on cards",
        })}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Images</Label>
          <ImageUploader value={images} onChange={setImages} />
        </div>
        {text("goals", "Goals (comma-separated)", { placeholder: "muscle, performance" })}
        {text("tags", "Tags (comma-separated)", { placeholder: "whey, isolate" })}
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border p-6">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
            <SelectTrigger className="w-40 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["active", "draft", "archived"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.isFeatured}
            onCheckedChange={(v) => set("isFeatured", Boolean(v))}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.isBestseller}
            onCheckedChange={(v) => set("isBestseller", Boolean(v))}
          />
          Bestseller
        </label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {editing ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
