"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  RANGES,
  RANGE_LABELS,
  type RangeKey,
  type SalesReport,
} from "@/lib/analytics";

export function SalesDashboard({ report }: { report: SalesReport }) {
  const router = useRouter();
  const params = useSearchParams();
  const [downloading, setDownloading] = React.useState(false);

  const range = (params.get("range") as RangeKey) ?? "month";
  const { totals, trend, topProducts, statusBreakdown, coupons } = report;

  function setRange(next: RangeKey) {
    router.push(`/admin/sales${next === "month" ? "" : `?range=${next}`}`);
  }

  /** Opens the print dialog on a server-rendered report page. */
  function downloadPdf() {
    setDownloading(true);
    const w = window.open(`/admin/sales/report?range=${range}`, "_blank");
    if (!w) {
      setDownloading(false);
      return;
    }
    // The report page triggers print on load; just reset our own button state.
    setTimeout(() => setDownloading(false), 1200);
  }

  const peak = Math.max(1, ...trend.map((t) => t.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
            Sales &amp; Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            {report.rangeLabel} · paid orders only
          </p>
        </div>

        <Button onClick={downloadPdf} disabled={downloading}>
          <Download className="mr-1.5 size-4" />
          Download PDF
        </Button>
      </div>

      {/* Range picker */}
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
              range === r
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/60 hover:bg-accent"
            )}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={IndianRupee}
          label="Revenue"
          value={formatINR(totals.revenue)}
          change={totals.revenueChange}
        />
        <Kpi
          icon={ShoppingCart}
          label="Orders"
          value={String(totals.orders)}
          change={totals.ordersChange}
        />
        <Kpi icon={Package} label="Units sold" value={String(totals.units)} />
        <Kpi
          icon={TrendingUp}
          label="Avg order value"
          value={formatINR(totals.avgOrderValue)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Discounts given" value={formatINR(totals.discountGiven)} />
        <MiniStat label="Shipping collected" value={formatINR(totals.shippingCollected)} />
        <MiniStat
          label="New customers"
          value={String(totals.newCustomers)}
          icon={Users}
        />
        <MiniStat
          label="Low / out of stock"
          value={String(report.lowStockCount)}
          icon={AlertTriangle}
          tone={report.lowStockCount > 0 ? "warn" : undefined}
        />
      </div>

      {/* Trend */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Revenue trend
        </h2>

        {trend.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No paid orders in this period.
          </p>
        ) : (
          <div className="mt-6 flex h-56 items-end gap-1.5 overflow-x-auto">
            {trend.map((t) => (
              <div
                key={t.label}
                className="group flex min-w-[2rem] flex-1 flex-col items-center justify-end gap-2"
                title={`${t.label}: ${formatINR(t.revenue)} · ${t.orders} order(s)`}
              >
                <span className="text-[0.65rem] font-medium opacity-0 transition-opacity group-hover:opacity-100">
                  {formatINR(t.revenue)}
                </span>
                <div
                  className="w-full rounded-t bg-primary transition-all duration-700 ease-out group-hover:bg-primary/80"
                  style={{ height: `${Math.max(2, (t.revenue / peak) * 100)}%` }}
                />
                <span className="whitespace-nowrap text-[0.65rem] text-muted-foreground">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Top products
          </h2>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.units} units</p>
                  </div>
                  <span className="shrink-0 font-semibold">{formatINR(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Status mix */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Order status mix
          </h2>
          {statusBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {statusBreakdown.map((s) => {
                const total = statusBreakdown.reduce((sum, x) => sum + x.count, 0);
                const pct = total ? (s.count / total) * 100 : 0;
                return (
                  <li key={s.status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{s.status}</span>
                      <span className="text-muted-foreground">
                        {s.count} · {Math.round(pct)}%
                      </span>
                    </div>
                    <span className="block h-2 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary transition-[width] duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Coupons */}
      {coupons.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight">
            <Tag className="size-4 text-primary" />
            Coupon performance
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 text-right font-medium">Uses</th>
                  <th className="pb-2 text-right font-medium">Discount given</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c.code}>
                    <td className="py-2 font-mono font-medium">{c.code}</td>
                    <td className="py-2 text-right">{c.uses}</td>
                    <td className="py-2 text-right">{formatINR(c.discount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change?: number | null;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 blur-2xl transition-transform duration-500 group-hover:scale-125"
      />
      <div className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="relative mt-2 font-display text-3xl font-extrabold">{value}</p>
      {change != null && (
        <p
          className={cn(
            "relative mt-1 inline-flex items-center gap-1 text-xs font-medium",
            up ? "text-success" : "text-destructive"
          )}
        >
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {up ? "+" : ""}
          {change}% vs previous period
        </p>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "warn";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className={cn("size-3.5", tone === "warn" && "text-amber-500")} />}
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-xl font-bold",
          tone === "warn" && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}
