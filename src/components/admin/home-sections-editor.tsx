"use client";

import * as React from "react";
import {
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Package,
  LayoutGrid,
  Video,
  Quote,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import type { HomeSectionDTO } from "@/server/services/home.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/admin/image-uploader";
import { cn } from "@/lib/utils";

type Section = HomeSectionDTO;
type Picker = { slug: string; name: string };

const TYPE_META: Record<
  Section["type"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  products: { label: "Products", icon: Package },
  categories: { label: "Categories", icon: LayoutGrid },
  video: { label: "Video slider", icon: Video },
  testimonials: { label: "Testimonials", icon: Quote },
  banner: { label: "Banner", icon: ImageIcon },
  richtext: { label: "Rich text", icon: FileText },
};

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function emptySection(type: Section["type"]): Section {
  return {
    id: newId(),
    type,
    title: "",
    description: "",
    enabled: true,
    productSource: "manual",
    productSlugs: [],
    categorySlug: "",
    limit: 8,
    layout: "grid",
    viewAllHref: "",
    categorySlugs: [],
    videos: [],
    testimonials: [],
    image: "",
    ctaLabel: "",
    ctaHref: "",
    html: "",
  };
}

/* ------------------------- small sub-editors ------------------------- */

function ProductMultiSelect({
  products,
  selected,
  onChange,
}: {
  products: Picker[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}) {
  const [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? products.filter((p) => p.name.toLowerCase().includes(s) || p.slug.includes(s))
      : products;
    return list.slice(0, 40);
  }, [q, products]);

  function toggle(slug: string) {
    onChange(
      selected.includes(slug) ? selected.filter((x) => x !== slug) : [...selected, slug]
    );
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((slug) => {
            const p = products.find((x) => x.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggle(slug)}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium"
              >
                {p?.name ?? slug}
                <Trash2 className="size-3" />
              </button>
            );
          })}
        </div>
      )}
      <Input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {filtered.length === 0 && (
          <p className="p-2 text-sm text-muted-foreground">No products match.</p>
        )}
        {filtered.map((p) => (
          <label
            key={p.slug}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
          >
            <Checkbox
              checked={selected.includes(p.slug)}
              onCheckedChange={() => toggle(p.slug)}
            />
            {p.name}
          </label>
        ))}
      </div>
    </div>
  );
}

function ChipMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: Picker[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}) {
  function toggle(slug: string) {
    onChange(
      selected.includes(slug) ? selected.filter((x) => x !== slug) : [...selected, slug]
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing to choose yet.</p>
      )}
      {options.map((o) => {
        const on = selected.includes(o.slug);
        return (
          <button
            key={o.slug}
            type="button"
            onClick={() => toggle(o.slug)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              on
                ? "border-primary bg-primary/10 font-medium"
                : "border-border text-muted-foreground hover:border-foreground/40"
            )}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------- main editor ---------------------------- */

export function HomeSectionsEditor({
  value,
  onChange,
  categories,
  products,
}: {
  value: Section[];
  onChange: (next: Section[]) => void;
  categories: Picker[];
  products: Picker[];
}) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const update = (i: number, patch: Partial<Section>) =>
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= value.length) return;
    const next = [...value];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {value.map((s, i) => {
        const Meta = TYPE_META[s.type];
        return (
          <div
            key={s.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) reorder(dragIndex, i);
              setDragIndex(null);
            }}
            className={cn(
              "rounded-xl border bg-card transition-shadow",
              dragIndex === i ? "border-primary shadow-lg" : "border-border",
              !s.enabled && "opacity-60"
            )}
          >
            {/* header */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <span className="cursor-grab text-muted-foreground active:cursor-grabbing" title="Drag to reorder">
                <GripVertical className="size-4" />
              </span>
              <Meta.icon className="size-4 text-primary" />
              <span className="text-sm font-semibold">{Meta.label}</span>
              {s.title && <span className="truncate text-sm text-muted-foreground">· {s.title}</span>}
              <div className="ml-auto flex items-center gap-1">
                <label className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Checkbox
                    checked={s.enabled}
                    onCheckedChange={(v) => update(i, { enabled: v === true })}
                  />
                  Live
                </label>
                <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={i === value.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move down"
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(i)}
                  aria-label="Remove section"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {/* body */}
            <div className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Section title</Label>
                  <Input
                    value={s.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="e.g. Bestselling protein"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>“View all” link (optional)</Label>
                  <Input
                    value={s.viewAllHref}
                    onChange={(e) => update(i, { viewAllHref: e.target.value })}
                    placeholder="/products"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Input
                  value={s.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  placeholder="Short supporting line under the title"
                />
              </div>

              {s.type === "products" && (
                <div className="space-y-3 rounded-lg bg-muted/40 p-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Source</Label>
                      <select
                        value={s.productSource}
                        onChange={(e) =>
                          update(i, { productSource: e.target.value as Section["productSource"] })
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="manual">Hand-picked</option>
                        <option value="featured">Featured</option>
                        <option value="bestsellers">Bestsellers</option>
                        <option value="category">By category</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max items</Label>
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        value={s.limit}
                        onChange={(e) => update(i, { limit: Number(e.target.value) || 8 })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Layout</Label>
                      <select
                        value={s.layout}
                        onChange={(e) => update(i, { layout: e.target.value as Section["layout"] })}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="grid">Grid</option>
                        <option value="carousel">Carousel</option>
                      </select>
                    </div>
                  </div>

                  {s.productSource === "manual" && (
                    <div className="space-y-1.5">
                      <Label>Pick products</Label>
                      <ProductMultiSelect
                        products={products}
                        selected={s.productSlugs}
                        onChange={(slugs) => update(i, { productSlugs: slugs })}
                      />
                    </div>
                  )}
                  {s.productSource === "category" && (
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <select
                        value={s.categorySlug}
                        onChange={(e) => update(i, { categorySlug: e.target.value })}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="">Select a category…</option>
                        {categories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {s.type === "categories" && (
                <div className="space-y-1.5 rounded-lg bg-muted/40 p-3">
                  <Label>Categories (leave empty to show all)</Label>
                  <ChipMultiSelect
                    options={categories}
                    selected={s.categorySlugs}
                    onChange={(slugs) => update(i, { categorySlugs: slugs })}
                  />
                </div>
              )}

              {s.type === "video" && (
                <VideoEditor
                  videos={s.videos}
                  products={products}
                  onChange={(videos) => update(i, { videos })}
                />
              )}

              {s.type === "testimonials" && (
                <TestimonialEditor
                  items={s.testimonials}
                  onChange={(testimonials) => update(i, { testimonials })}
                />
              )}

              {s.type === "banner" && (
                <div className="grid gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Banner image</Label>
                    <ImageUploader
                      value={s.image ? [s.image] : []}
                      onChange={(next) => update(i, { image: next[0] ?? "" })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Button label</Label>
                    <Input value={s.ctaLabel} onChange={(e) => update(i, { ctaLabel: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Button link</Label>
                    <Input
                      value={s.ctaHref}
                      onChange={(e) => update(i, { ctaHref: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
              )}

              {s.type === "richtext" && (
                <div className="space-y-1.5 rounded-lg bg-muted/40 p-3">
                  <Label>HTML content</Label>
                  <textarea
                    value={s.html}
                    onChange={(e) => update(i, { html: e.target.value })}
                    rows={6}
                    className="w-full rounded-md border border-input bg-background p-2 font-mono text-sm"
                    placeholder="<h3>Heading</h3><p>Paragraph…</p>"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* add-section palette */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border p-3">
        <span className="self-center text-sm font-medium text-muted-foreground">Add section:</span>
        {(Object.keys(TYPE_META) as Section["type"][]).map((type) => {
          const M = TYPE_META[type];
          return (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => onChange([...value, emptySection(type)])}
            >
              <M.icon className="mr-1 size-4" />
              {M.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------- video + testimonial editors ---------------------- */

function VideoEditor({
  videos,
  products,
  onChange,
}: {
  videos: Section["videos"];
  products: Picker[];
  onChange: (v: Section["videos"]) => void;
}) {
  const upd = (i: number, patch: Partial<Section["videos"][number]>) =>
    onChange(videos.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  return (
    <div className="space-y-3 rounded-lg bg-muted/40 p-3">
      {videos.map((v, i) => (
        <div key={i} className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
          <div className="flex items-center justify-between sm:col-span-2">
            <p className="text-sm font-semibold">Video {i + 1}</p>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => onChange(videos.filter((_, idx) => idx !== i))}
              aria-label="Remove video"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Video URL (mp4/webm or YouTube)</Label>
            <Input value={v.url} onChange={(e) => upd(i, { url: e.target.value })} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Caption</Label>
            <Input value={v.caption} onChange={(e) => upd(i, { caption: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Assigned product</Label>
            <select
              value={v.productSlug}
              onChange={(e) => upd(i, { productSlug: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">None</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Poster image (optional, for mp4)</Label>
            <ImageUploader
              value={v.poster ? [v.poster] : []}
              onChange={(next) => upd(i, { poster: next[0] ?? "" })}
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...videos, { url: "", poster: "", caption: "", productSlug: "" }])}
      >
        <Plus className="mr-1 size-4" /> Add video
      </Button>
    </div>
  );
}

function TestimonialEditor({
  items,
  onChange,
}: {
  items: Section["testimonials"];
  onChange: (v: Section["testimonials"]) => void;
}) {
  const upd = (i: number, patch: Partial<Section["testimonials"][number]>) =>
    onChange(items.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  return (
    <div className="space-y-3 rounded-lg bg-muted/40 p-3">
      {items.map((t, i) => (
        <div key={i} className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
          <div className="flex items-center justify-between sm:col-span-2">
            <p className="text-sm font-semibold">Testimonial {i + 1}</p>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label="Remove testimonial"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label>Author</Label>
            <Input value={t.author} onChange={(e) => upd(i, { author: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Role / location</Label>
            <Input value={t.role} onChange={(e) => upd(i, { role: e.target.value })} placeholder="Verified buyer" />
          </div>
          <div className="space-y-1.5">
            <Label>Rating (1–5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={t.rating}
              onChange={(e) => upd(i, { rating: Number(e.target.value) || 5 })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Quote</Label>
            <textarea
              value={t.body}
              onChange={(e) => upd(i, { body: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-input bg-background p-2 text-sm"
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { author: "", role: "", rating: 5, body: "", avatar: "" }])}
      >
        <Plus className="mr-1 size-4" /> Add testimonial
      </Button>
    </div>
  );
}
