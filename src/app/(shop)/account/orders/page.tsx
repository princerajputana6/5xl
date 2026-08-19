import type { Metadata } from "next";
import Link from "next/link";
import { Package, ArrowRight, CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUserOrders } from "@/server/services/order.service";
import { formatINR, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { ProductImage } from "@/components/shop/product-image";
import { CancelOrderButton } from "@/components/shop/cancel-order-button";

export const metadata: Metadata = { title: "My Orders · 5XL" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getUserOrders(user.id);

  const totalSpent = orders.reduce((s, o) => s + o.amounts.total, 0);

  return (
    <div className="container-5xl py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">My Orders</h1>
        {orders.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{orders.length}</strong> order
            {orders.length === 1 ? "" : "s"} ·{" "}
            <strong className="text-foreground">{formatINR(totalSpent)}</strong> spent
          </p>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-10" />}
          title="No orders yet"
          description="When you place an order it'll appear here."
          actionLabel="Start shopping"
          actionHref="/products"
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order, i) => {
            const itemCount = order.items.reduce((s, it) => s + it.qty, 0);
            const extra = order.items.length - 5;
            const isUnpaid = order.status === "pending" && order.payment.status !== "paid";

            return (
              <li
                key={order.id}
                style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
              >
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className={`group relative block overflow-hidden border border-border bg-card transition-all duration-300 hover:border-primary/60 hover:shadow-md ${
                    isUnpaid ? "rounded-t-xl" : "rounded-xl hover:-translate-y-0.5"
                  }`}
                >
                  {/* Brand rule that sweeps in on hover */}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                      <p className="font-mono text-sm font-semibold transition-colors group-hover:text-primary">
                        {order.orderNumber}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {formatDate(order.placedAt)} · {itemCount} item{itemCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-display text-xl font-bold">
                        {formatINR(order.amounts.total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-5 py-4">
                    {order.items.slice(0, 5).map((item) => (
                      <span
                        key={`${item.productId}-${item.variantId}`}
                        title={item.name}
                        className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                      >
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </span>
                    ))}

                    {extra > 0 && (
                      <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground">
                        +{extra}
                      </span>
                    )}

                    <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                      View details
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>

                {isUnpaid && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border border-t-0 border-border bg-amber-50 px-5 py-3 dark:bg-amber-500/10">
                    <p className="text-xs text-amber-900 dark:text-amber-300">
                      Payment was never completed — nothing has been charged.
                    </p>
                    <CancelOrderButton orderNumber={order.orderNumber} className="h-8 text-xs" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
