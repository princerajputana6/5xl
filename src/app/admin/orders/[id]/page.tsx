import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission, getCurrentUser } from "@/lib/session";
import { getOrderForAdmin } from "@/server/services/admin.service";
import { hasPermission, type Role } from "@/server/rbac";
import { formatINR, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";

export const metadata = { title: "Order detail" };

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("orders:read");
  const user = await getCurrentUser();
  const canWrite = hasPermission(user?.role as Role, "orders:write");

  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.customer.name} · {order.customer.email} · {formatDate(order.placedAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] [&>*]:min-w-0">
        <div className="space-y-6">
          {/* Scrolls on narrow screens instead of squashing four columns. */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-center font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map((item) => (
                  <tr key={`${item.productId}-${item.variantId}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <span className="grid h-full place-items-center">🥤</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.variantLabel && (
                            <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{item.qty}</td>
                    <td className="px-4 py-3 text-right">{formatINR(item.price)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td>
                  <td className="px-4 py-2 text-right">{formatINR(order.amounts.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Shipping</td>
                  <td className="px-4 py-2 text-right">
                    {order.amounts.shipping === 0 ? "FREE" : formatINR(order.amounts.shipping)}
                  </td>
                </tr>
                <tr className="font-semibold">
                  <td colSpan={3} className="px-4 py-2 text-right">Total</td>
                  <td className="px-4 py-2 text-right">{formatINR(order.amounts.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="rounded-xl border border-border p-5">
            <h2 className="mb-3 font-display text-lg font-bold uppercase">Timeline</h2>
            <ol className="space-y-3">
              {order.timeline.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium capitalize">{t.status}</p>
                    {t.note && <p className="text-muted-foreground">{t.note}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(t.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-6">
          {canWrite && (
            <div className="rounded-xl border border-border p-5">
              <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
            </div>
          )}

          <div className="rounded-xl border border-border p-5">
            <h2 className="font-display text-lg font-bold uppercase">Payment</h2>
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Status: </span>
              <span className="font-medium capitalize">{order.payment.status}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Method: </span>
              {order.payment.provider}
              {order.payment.mode === "stub" && " (test)"}
            </p>
          </div>

          <div className="rounded-xl border border-border p-5">
            <h2 className="font-display text-lg font-bold uppercase">Ship to</h2>
            <address className="mt-2 text-sm not-italic leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{order.address.name}</span>
              <br />
              {order.address.line1}
              {order.address.line2 && <>, {order.address.line2}</>}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
              <br />
              {order.address.country} · 📞 {order.address.phone}
            </address>
          </div>
        </aside>
      </div>
    </div>
  );
}
