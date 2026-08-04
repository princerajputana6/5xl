import Link from "next/link";
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { getDashboardStats } from "@/server/services/admin.service";
import { formatINR, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";

export const metadata = { title: "Dashboard" };

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={accent ? "size-5 text-primary" : "size-5 text-muted-foreground"} />
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  // Any staff member can view the dashboard; the admin layout already gates
  // access to staff only.
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Store performance at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Revenue (paid)" value={formatINR(stats.revenue)} accent />
        <StatCard icon={ShoppingCart} label="Orders" value={String(stats.totalOrders)} />
        <StatCard icon={Package} label="Products" value={String(stats.products)} />
        <StatCard icon={Users} label="Customers" value={String(stats.customers)} />
        <StatCard icon={Clock} label="Pending payment" value={String(stats.pendingOrders)} />
        <StatCard icon={ShoppingCart} label="Paid orders" value={String(stats.paidOrders)} />
        <StatCard icon={AlertTriangle} label="Low stock (≤5)" value={String(stats.lowStock)} />
        <StatCard
          icon={IndianRupee}
          label="Avg. order value"
          value={formatINR(stats.paidOrders ? Math.round(stats.revenue / stats.paidOrders) : 0)}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-foreground/70 hover:text-foreground hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono font-medium hover:text-primary">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p>{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(o.placedAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(o.total)}</td>
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
