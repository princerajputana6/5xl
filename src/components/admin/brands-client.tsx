"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import type { BrandRow } from "@/server/services/brand.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  logo: string;
  description: string;
  isActive: boolean;
};

const EMPTY: FormState = { name: "", slug: "", logo: "", description: "", isActive: true };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function BrandsClient({ rows }: { rows: BrandRow[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>({ ...EMPTY });
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setSlugTouched(false);
    setOpen(true);
  }

  function openEdit(r: BrandRow) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      slug: r.slug,
      logo: r.logo ?? "",
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
      logo: form.logo.trim() || undefined,
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    };
    const url = editingId ? `/api/admin/brands/${editingId}` : "/api/admin/brands";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not save brand.");
      return;
    }
    toast.success(editingId ? "Brand updated." : "Brand created.");
    setOpen(false);
    router.refresh();
  }

  async function remove(r: BrandRow) {
    if (!confirm(`Delete “${r.name}”? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/brands/${r.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Could not delete brand.");
      return;
    }
    toast.success("Brand deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground">{rows.length} brand(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" /> New brand
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No brands yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted text-xs font-bold uppercase text-muted-foreground">
                        {r.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.logo} alt="" className="size-full object-contain p-1" />
                        ) : (
                          r.name.slice(0, 2)
                        )}
                      </span>
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">/{r.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.productCount}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border-transparent",
                        r.isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {r.isActive ? "Active" : "Hidden"}
                    </Badge>
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
            <DialogTitle>{editingId ? "Edit brand" : "New brand"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bname">Name</Label>
                <Input
                  id="bname"
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                  placeholder="5XL Nutrition"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bslug">Slug</Label>
                <Input
                  id="bslug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  placeholder="5xl"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bdesc">Description</Label>
              <Input
                id="bdesc"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Our own lab-tested, athlete-grade line."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Logo</Label>
              <ImageUploader
                value={form.logo ? [form.logo] : []}
                onChange={(next) => set("logo", next[0] ?? "")}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.isActive} onCheckedChange={(v) => set("isActive", v === true)} />
              Active
            </label>

            <DialogFooter>
              <Button type="submit" disabled={pending || !form.name.trim() || !form.slug.trim()}>
                {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingId ? "Save changes" : "Create brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
