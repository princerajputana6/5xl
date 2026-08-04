import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUserOrders } from "@/server/services/order.service";
import { formatINR, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";

export const metadata: Metadata = { title: "My Orders · 5XL" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getUserOrders(user.id);

  return (
    <div className="container-5xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-tight">
        My Orders
      </h1>

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
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="font-mono text-sm font-semibold hover:text-primary"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Placed {formatDate(order.placedAt)} · {order.items.length} item
                    {order.items.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-semibold">{formatINR(order.amounts.total)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {order.items.slice(0, 5).map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="relative size-12 overflow-hidden rounded-md border border-border bg-muted"
                    title={item.name}
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-lg">🥤</span>
                    )}
                  </div>
                ))}
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="ml-auto text-sm font-semibold text-foreground/70 hover:text-foreground hover:underline"
                >
                  View details →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
