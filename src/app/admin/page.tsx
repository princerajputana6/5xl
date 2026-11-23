import Link from "next/link";
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { getDashboardStats } from "@/server/services/admin.service";
import { formatINR, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

/** Headline KPI — gold icon chip, large value, supporting hint. */
function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        "admin-card rounded-2xl border border-border bg-card p-5",
        primary && "admin-gold-rule"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </span>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Operational stat — compact, links to the relevant list, tone-aware. */
function MiniStat({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  tone?: "amber" | "red";
}) {
  const chip =
    tone === "red"
      ? "bg-destructive/12 text-destructive"
      : tone === "amber"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-muted text-muted-foreground";

  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", chip)}>
          <Icon className="size-[18px]" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
      {href && (
        <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </>
  );

  const className =
    "admin-card group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function AdminDashboard() {
  // Any staff member can view the dashboard; the admin layout gates access to
  // staff only.
  const stats = await getDashboardStats();
  const aov = stats.paidOrders ? Math.round(stats.revenue / stats.paidOrders) : 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Store performance at a glance." />

      {/* Headline KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          primary
          icon={IndianRupee}
          label="Revenue (paid)"
          value={formatINR(stats.revenue)}
          hint={`${stats.paidOrders} paid order${stats.paidOrders === 1 ? "" : "s"}`}
        />
        <KpiCard
          icon={ShoppingCart}
          label="Total orders"
          value={String(stats.totalOrders)}
          hint={`${stats.pendingOrders} awaiting payment`}
        />
        <KpiCard icon={TrendingUp} label="Avg. order value" value={formatINR(aov)} />
        <KpiCard icon={Users} label="Customers" value={String(stats.customers)} />
      </div>

      {/* Operational stats — each links to the list it summarizes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={Package} label="Products" value={String(stats.products)} href="/admin/products" />
        <MiniStat icon={ShoppingCart} label="Paid orders" value={String(stats.paidOrders)} href="/admin/orders" />
        <MiniStat
          icon={Clock}
          label="Pending payment"
          value={String(stats.pendingOrders)}
          tone={stats.pendingOrders > 0 ? "amber" : undefined}
          href="/admin/orders"
        />
        <MiniStat
          icon={AlertTriangle}
          label="Low stock (≤5)"
          value={String(stats.lowStock)}
          tone={stats.lowStock > 0 ? "red" : undefined}
          href="/admin/products?stock=low"
        />
      </div>

      {/* Recent orders */}
      <section className="admin-card overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono font-medium hover:text-primary"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(o.placedAt)}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">
                      {formatINR(o.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
