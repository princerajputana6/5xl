"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  IndianRupee,
  Images,
  FileText,
  Layers,
  Settings2,
  Search,
  AlertCircle,
} from "lucide-react";
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
import { FieldList, NutritionEditor, type NutritionRow } from "@/components/admin/field-list";
import { VariantsEditor, type VariantDraft } from "@/components/admin/variants-editor";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminProductForm } from "@/server/services/admin.service";

type Option = { id: string; name: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Groups the form into digestible sections rather than one long column. */
function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-start gap-3 border-b border-border px-6 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15">
          <Icon className="size-4 text-primary" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold uppercase tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

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
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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
    usage: initial?.usage ?? "",
    goals: (initial?.goals ?? []).join(", "),
    tags: (initial?.tags ?? []).join(", "),
    status: initial?.status ?? "active",
    isFeatured: initial?.isFeatured ?? false,
    isBestseller: initial?.isBestseller ?? false,
    seoTitle: initial?.seo?.title ?? "",
    seoDescription: initial?.seo?.description ?? "",
  });

  const [images, setImages] = React.useState<string[]>(initial?.images ?? []);
  const [benefits, setBenefits] = React.useState<string[]>(initial?.benefits ?? []);
  const [ingredients, setIngredients] = React.useState<string[]>(initial?.ingredients ?? []);
  const [nutrition, setNutrition] = React.useState<NutritionRow[]>(
    initial?.nutritionFacts ?? []
  );
  const [variants, setVariants] = React.useState<VariantDraft[]>(initial?.variants ?? []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const price = Number(form.price) || 0;
  const mrp = Number(form.mrp) || 0;
  const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  /** Client-side checks that mirror the server schema, for instant feedback. */
  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Name is required.";
    const slug = form.slug || slugify(form.name);
    if (!/^[a-z0-9-]+$/.test(slug)) next.slug = "Lowercase letters, numbers and hyphens only.";
    if (!form.sku.trim()) next.sku = "SKU is required.";
    if (!form.brand) next.brand = "Select a brand.";
    if (!form.category) next.category = "Select a category.";
    if (!form.price || price < 0) next.price = "Enter a valid price.";
    if (!form.mrp || mrp < 0) next.mrp = "Enter an MRP.";
    if (mrp > 0 && price > mrp) next.price = "Price can't be higher than MRP.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Check the highlighted fields.");
      return false;
    }
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setPending(true);

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      sku: form.sku,
      brand: form.brand,
      category: form.category,
      price,
      mrp,
      stock: Number(form.stock) || 0,
      gstPct: Number(form.gstPct) || 0,
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      usage: form.usage || undefined,
      images,
      goals: csv(form.goals),
      tags: csv(form.tags),
      benefits: benefits.filter(Boolean),
      ingredients: ingredients.filter(Boolean),
      nutritionFacts: nutrition.filter((n) => n.label && n.value),
      variants: variants.filter((v) => v.label && v.sku),
      status: form.status,
      isFeatured: form.isFeatured,
      isBestseller: form.isBestseller,
      seo: {
        title: form.seoTitle || undefined,
        description: form.seoDescription || undefined,
      },
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

  const field = (
    key: keyof typeof form,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
    hint?: string
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={String(form[key])}
        onChange={(e) => set(key, e.target.value as never)}
        aria-invalid={Boolean(errors[key])}
        className={cn(errors[key] && "border-destructive focus-visible:ring-destructive/30")}
        {...props}
      />
      {errors[key] ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" />
          {errors[key]}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={submit} className="pb-24">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] [&>*]:min-w-0">
        {/* ---- Main column ---- */}
        <div className="space-y-6">
          <Section
            icon={Package}
            title="Basics"
            description="How the product is identified across the store."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                {field("name", "Product name", {
                  placeholder: "Gold Whey Isolate",
                  onBlur: () => !form.slug && set("slug", slugify(form.name)),
                })}
              </div>

              {field("slug", "URL slug", { placeholder: "gold-whey-isolate" }, "/products/…")}
              {field("sku", "SKU", { placeholder: "5XL-WHEY-1KG" })}

              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Select value={form.brand} onValueChange={(v) => set("brand", v)}>
                  <SelectTrigger
                    className={cn("w-full", errors.brand && "border-destructive")}
                  >
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
                {errors.brand && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" />
                    {errors.brand}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger
                    className={cn("w-full", errors.category && "border-destructive")}
                  >
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
                {errors.category && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" />
                    {errors.category}
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section
            icon={IndianRupee}
            title="Pricing & stock"
            description="Base values, used when a product has no variants."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {field("price", "Selling price (₹)", { type: "number", inputMode: "numeric" })}
              {field("mrp", "MRP (₹)", { type: "number", inputMode: "numeric" })}
              {field("stock", "Stock units", { type: "number", inputMode: "numeric" })}
              {field("gstPct", "GST %", { type: "number", inputMode: "numeric", max: 28 })}
            </div>

            {discount > 0 && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                <strong>{discount}% off</strong> · customer saves {formatINR(mrp - price)}
              </p>
            )}
          </Section>

          <Section
            icon={Images}
            title="Photos"
            description="First image is the one shown on cards and listings."
          >
            <ImageUploader value={images} onChange={setImages} />
          </Section>

          <Section
            icon={FileText}
            title="Product detail content"
            description="Everything the product page shows below the buy box."
          >
            <div className="space-y-6">
              {field("shortDescription", "Short description", {
                placeholder: "One-line summary shown on cards",
              })}

              <div className="space-y-1.5">
                <Label htmlFor="description">Full description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  placeholder="What it is, who it's for, why it works…"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Key benefits</Label>
                <p className="text-xs text-muted-foreground">
                  Shown as a checked list on the product page.
                </p>
                <FieldList
                  value={benefits}
                  onChange={setBenefits}
                  placeholder="Supports lean muscle growth"
                  addLabel="Add benefit"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usage">Directions for use</Label>
                <textarea
                  id="usage"
                  value={form.usage}
                  onChange={(e) => set("usage", e.target.value)}
                  rows={4}
                  placeholder="Mix one scoop in 200 ml water. Take post-workout…"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                />
                <p className="text-xs text-muted-foreground">
                  Each sentence or line becomes a numbered step.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Ingredients</Label>
                <FieldList
                  value={ingredients}
                  onChange={setIngredients}
                  placeholder="Whey protein isolate"
                  addLabel="Add ingredient"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Nutrition facts</Label>
                <NutritionEditor value={nutrition} onChange={setNutrition} />
              </div>
            </div>
          </Section>

          <Section
            icon={Layers}
            title="Variants"
            description="Flavours and pack sizes with their own price and stock."
          >
            <VariantsEditor
              value={variants}
              onChange={setVariants}
              fallbackSku={form.sku}
              fallbackPrice={price}
              fallbackMrp={mrp}
            />
          </Section>

          <Section icon={Search} title="Search & SEO" description="Optional meta overrides.">
            <div className="space-y-4">
              {field("seoTitle", "SEO title", { placeholder: "Defaults to the product name" })}
              <div className="space-y-1.5">
                <Label htmlFor="seoDescription">Meta description</Label>
                <textarea
                  id="seoDescription"
                  value={form.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  rows={2}
                  maxLength={160}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {form.seoDescription.length}/160
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* ---- Sidebar ---- */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Section icon={Settings2} title="Visibility">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set("status", v as typeof form.status)}
                >
                  <SelectTrigger className="w-full capitalize">
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
                <p className="text-xs text-muted-foreground">
                  Only <strong>active</strong> products appear in the store.
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/60">
                <Checkbox
                  checked={form.isFeatured}
                  onCheckedChange={(v) => set("isFeatured", Boolean(v))}
                />
                <span>
                  <span className="font-medium">Featured</span>
                  <span className="block text-xs text-muted-foreground">
                    Shows in the homepage hero
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/60">
                <Checkbox
                  checked={form.isBestseller}
                  onCheckedChange={(v) => set("isBestseller", Boolean(v))}
                />
                <span>
                  <span className="font-medium">Bestseller</span>
                  <span className="block text-xs text-muted-foreground">
                    Adds a badge on product cards
                  </span>
                </span>
              </label>
            </div>
          </Section>

          <Section icon={Layers} title="Organisation">
            <div className="space-y-4">
              {field(
                "goals",
                "Goals",
                { placeholder: "muscle, performance" },
                "Comma-separated. Powers the “shop by goal” filters."
              )}
              {field(
                "tags",
                "Tags",
                { placeholder: "whey, isolate" },
                "Comma-separated. Used by search."
              )}
            </div>
          </Section>

          {/* Live card preview */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Card preview
            </p>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="relative aspect-square bg-muted">
                {images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[0]} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-xs text-muted-foreground">
                    No image yet
                  </span>
                )}
                {form.isBestseller && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-bold uppercase text-primary-foreground">
                    Bestseller
                  </span>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 text-sm font-medium">
                  {form.name || "Product name"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">{formatINR(price)}</span>{" "}
                  {discount > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatINR(mrp)}
                      </span>{" "}
                      <span className="text-xs font-semibold text-success">{discount}% off</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <p className="hidden text-xs text-muted-foreground sm:block">
            {editing ? `Editing ${initial?.name}` : "New product"} ·{" "}
            <span className="capitalize">{form.status}</span>
            {images.length > 0 && ` · ${images.length} image${images.length === 1 ? "" : "s"}`}
          </p>
          <div className="ml-auto flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/admin/products")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
