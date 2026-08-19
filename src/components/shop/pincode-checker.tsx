"use client";

import * as React from "react";
import { MapPin, Truck, RotateCcw, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Result = { ok: true; days: number; cod: boolean } | { ok: false };

/**
 * Delivery estimate for a pincode. Until a courier serviceability API is wired
 * up, the estimate is derived from the pincode's zone digit so the same input
 * always returns the same answer.
 */
function estimate(pincode: string): Result {
  if (!/^[1-9]\d{5}$/.test(pincode)) return { ok: false };
  const zone = Number(pincode[0]);
  const days = zone <= 3 ? 2 : zone <= 6 ? 3 : 5;
  return { ok: true, days, cod: zone !== 7 };
}

export function PincodeChecker() {
  const [pincode, setPincode] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setResult(null);
    // Brief delay so the state change reads as a lookup rather than a flicker.
    setTimeout(() => {
      setResult(estimate(pincode));
      setChecking(false);
    }, 450);
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <MapPin className="size-4 text-primary" />
        Check delivery to your area
      </p>

      <form onSubmit={check} className="mt-3 flex gap-2">
        <Input
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setResult(null);
          }}
          placeholder="Enter 6-digit pincode"
          inputMode="numeric"
          aria-label="Pincode"
          className="h-10"
        />
        <Button type="submit" variant="secondary" disabled={pincode.length !== 6 || checking} className="h-10 shrink-0">
          {checking ? <Loader2 className="size-4 animate-spin" /> : "Check"}
        </Button>
      </form>

      {result && (
        <p
          className={cn(
            "mt-3 animate-in fade-in slide-in-from-top-1 text-sm",
            result.ok ? "text-success" : "text-destructive"
          )}
        >
          {result.ok ? (
            <>
              Delivers in <strong>{result.days} days</strong>
              {result.cod ? " · Cash on delivery available" : " · Prepaid orders only"}
            </>
          ) : (
            "That doesn't look like a valid Indian pincode."
          )}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
        {[
          { icon: Truck, title: "Free shipping", sub: "Above ₹999" },
          { icon: RotateCcw, title: "7-day returns", sub: "T&C apply" },
          { icon: ShieldCheck, title: "100% authentic", sub: "Lab tested" },
        ].map(({ icon: Icon, title, sub }) => (
          <div key={title} className="group flex flex-col items-center gap-1 text-center">
            <Icon className="size-5 text-primary transition-transform duration-200 group-hover:-translate-y-0.5" />
            <p className="text-xs font-semibold leading-tight">{title}</p>
            <p className="text-[0.7rem] leading-tight text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
