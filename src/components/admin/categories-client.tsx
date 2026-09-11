"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import type { CategoryRow } from "@/server/services/category.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  slug: string;
  emoji: string;
  image: string;
  parent: string; // "" = none
  description: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  emoji: "",
  image: "",
  parent: "",
  description: "",
  isActive: true,
};

const NONE = "__none__";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoriesClient({ rows }: { rows: CategoryRow[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>({ ...EMPTY });
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);
  const [order, setOrder] = React.useState(rows);
  // Re-sync local ordering when the server data changes (after router.refresh),
  // adjusting state during render — no effect needed.
  const [prevRows, setPrevRows] = React.useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setOrder(rows);
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setSlugTouched(false);
    setOpen(true);
  }

  function openEdit(r: CategoryRow) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      slug: r.slug,
      emoji: r.emoji ?? "",
      image: r.image ?? "",
      parent: r.parent ?? "",
      description: r.description ?? "",
      isActive: r.isActive,
    });
    setSlugTouched(true);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      emoji: form.emoji.trim() || undefined,
      image: form.image.trim() || undefined,
      parent: form.parent || null,
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    };
    const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not save category.");
      return;
    }
    toast.success(editingId ? "Category updated." : "Category created.");
    setOpen(false);
    router.refresh();
  }

  async function toggleActive(r: CategoryRow) {
    const res = await fetch(`/api/admin/categories/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: r.name,
        slug: r.slug,
        emoji: r.emoji ?? undefined,
        image: r.image ?? undefined,
        parent: r.parent,
        description: r.description ?? undefined,
        isActive: !r.isActive,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Could not update category.");
      return;
    }
    router.refresh();
  }

  async function remove(r: CategoryRow) {
    if (!confirm(`Delete “${r.name}”? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/categories/${r.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Could not delete category.");
      return;
    }
    toast.success("Category deleted.");
    router.refresh();
  }

  function moveRow(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  async function saveOrder() {
    setReordering(true);
    const items = order.map((r, i) => ({ id: r.id, order: i }));
    const res = await fetch("/api/admin/categories/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setReordering(false);
    if (!res.ok) {
      toast.error("Could not save order.");
      return;
    }
    toast.success("Order saved.");
    router.refresh();
  }

  const orderChanged = order.some((r, i) => r.id !== rows[i]?.id);
  const parentOptions = rows.filter((r) => !r.parent); // only top-level as parents

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} categor{rows.length === 1 ? "y" : "ies"} · shown on the storefront homepage
          </p>
        </div>
        <div className="flex gap-2">
          {orderChanged && (
            <Button variant="outline" onClick={saveOrder} disabled={reordering}>
              {reordering && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save order
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="mr-1 size-4" /> New category
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-10 px-2 py-3" />
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No categories yet. Create your first one.
                </td>
              </tr>
            ) : (
              order.map((r, i) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-2 py-3">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={i === 0}
                        onClick={() => moveRow(i, -1)}
                        className="disabled:opacity-25 hover:text-foreground"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <GripVertical className="size-3 opacity-40" />
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={i === order.length - 1}
                        onClick={() => moveRow(i, 1)}
                        className="disabled:opacity-25 hover:text-foreground"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-xl">
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image} alt="" className="size-full object-cover" />
                        ) : (
                          <span>{r.emoji || "🏷️"}</span>
                        )}
                      </span>
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">/{r.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.parentName ?? "—"}</td>
                  <td className="px-4 py-3">{r.productCount}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(r)}>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "cursor-pointer border-transparent",
                          r.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {r.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(r)}
                        aria-label="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                  placeholder="Whey Protein"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  placeholder="whey-protein"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emoji">Emoji (fallback icon)</Label>
                <Input
                  id="emoji"
                  value={form.emoji}
                  onChange={(e) => set("emoji", e.target.value)}
                  placeholder="🥛"
                  maxLength={8}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Parent category</Label>
                <Select
                  value={form.parent || NONE}
                  onValueChange={(v) => set("parent", v === NONE ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None (top-level)</SelectItem>
                    {parentOptions
                      .filter((p) => p.id !== editingId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Fast-absorbing protein to build & recover"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Image (square works best)</Label>
              <ImageUploader
                value={form.image ? [form.image] : []}
                onChange={(next) => set("image", next[0] ?? "")}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isActive}
                onCheckedChange={(v) => set("isActive", v === true)}
              />
              Active (visible on the storefront)
            </label>

            <DialogFooter>
              <Button type="submit" disabled={pending || !form.name.trim() || !form.slug.trim()}>
                {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingId ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
