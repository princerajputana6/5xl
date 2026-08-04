"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Repeat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Variant = { id: string; label: string; price: number };

const INTERVALS = [
  { value: "30", label: "Every 30 days" },
  { value: "60", label: "Every 60 days" },
  { value: "90", label: "Every 90 days" },
];

export function SubscribeCard({
  slug,
  variants,
  basePrice,
  discountPct = 10,
}: {
  slug: string;
  variants: Variant[];
  basePrice: number;
  discountPct?: number;
}) {
  const router = useRouter();
  const [variantId, setVariantId] = React.useState(variants[0]?.id ?? "");
  const [interval, setInterval] = React.useState("30");
  const [pending, setPending] = React.useState(false);

  const selected = variants.find((v) => v.id === variantId);
  const unit = selected?.price ?? basePrice;
  const discounted = Math.round(unit * (1 - discountPct / 100));

  async function subscribe() {
    setPending(true);
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        variantId: variantId || null,
        qty: 1,
        intervalDays: Number(interval),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not subscribe.");
      return;
    }
    toast.success("Subscription created! Manage it in your account.");
    router.push("/account/subscriptions");
  }

  return (
    <div className="rounded-xl border border-primary/50 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <Repeat className="size-5 text-primary" />
        <h3 className="font-display text-lg font-bold uppercase">Subscribe & Save {discountPct}%</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Never run out. Auto-deliver on your schedule, cancel anytime.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {variants.length > 1 && (
          <Select value={variantId} onValueChange={setVariantId}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={interval} onValueChange={setInterval}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERVALS.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm">
          <span className="font-display text-xl font-extrabold">{formatINR(discounted)}</span>
          <span className="ml-2 text-muted-foreground line-through">{formatINR(unit)}</span>
          <span className="ml-1 text-muted-foreground">/ delivery</span>
        </span>
      </div>

      <Button onClick={subscribe} disabled={pending} className="mt-4 w-full">
        {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Subscribe
      </Button>
    </div>
  );
}
