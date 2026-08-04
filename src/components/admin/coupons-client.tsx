"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { AdminCouponRow } from "@/server/services/coupon.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY = {
  code: "",
  description: "",
  type: "percent" as "percent" | "flat",
  value: "",
  minOrder: "",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
};

export function CouponsClient({ coupons }: { coupons: AdminCouponRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(coupons.length === 0);
  const [form, setForm] = React.useState({ ...EMPTY });
  const [pending, setPending] = React.useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const payload = {
      code: form.code,
      description: form.description || undefined,
      type: form.type,
      value: Number(form.value),
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
      expiresAt: form.expiresAt || undefined,
    };
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create coupon.");
      return;
    }
    toast.success(`Coupon ${payload.code.toUpperCase()} created.`);
    setForm({ ...EMPTY });
    setShowForm(false);
    router.refresh();
  }

  async function toggle(c: AdminCouponRow) {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setActive: !c.isActive }),
    });
    if (!res.ok) {
      toast.error("Could not update coupon.");
      return;
    }
    toast.success(`${c.code} ${c.isActive ? "disabled" : "enabled"}.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">Coupons</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} coupon(s)</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1 size-4" /> {showForm ? "Close" : "New coupon"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={create} className="grid gap-4 rounded-xl border border-border p-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v as "percent" | "flat")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent (%)</SelectItem>
                <SelectItem value="flat">Flat (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="value">{form.type === "percent" ? "Percent off" : "Amount off (₹)"}</Label>
            <Input id="value" type="number" value={form.value} onChange={(e) => set("value", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minOrder">Min order (₹)</Label>
            <Input id="minOrder" type="number" value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} placeholder="0" />
          </div>
          {form.type === "percent" && (
            <div className="space-y-1.5">
              <Label htmlFor="maxDiscount">Max discount (₹)</Label>
              <Input id="maxDiscount" type="number" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} placeholder="0 = no cap" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="usageLimit">Usage limit</Label>
            <Input id="usageLimit" type="number" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="0 = unlimited" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">Expires</Label>
            <Input id="expiresAt" type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Shown internally" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending || !form.code.trim() || !form.value}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create coupon
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Min order</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 text-right font-medium">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No coupons yet.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold">{c.code}</p>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {c.type === "percent"
                      ? `${c.value}%${c.maxDiscount ? ` (max ${formatINR(c.maxDiscount)})` : ""}`
                      : formatINR(c.value)}
                  </td>
                  <td className="px-4 py-3">{c.minOrder ? formatINR(c.minOrder) : "—"}</td>
                  <td className="px-4 py-3">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => toggle(c)}>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "cursor-pointer border-transparent",
                          c.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {c.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
