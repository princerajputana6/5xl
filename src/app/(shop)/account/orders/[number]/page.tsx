import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUserOrderByNumber } from "@/server/services/order.service";
import { formatINR, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order details · 5XL" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const user = await requireUser();
  const { number } = await params;
  const { placed } = await searchParams;

  const order = await getUserOrderByNumber(user.id, number);
  if (!order) notFound();

  const justPlaced = placed === "1";

  return (
    <div className="container-5xl py-10">
      {justPlaced && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-display text-lg font-bold uppercase">Thank you! Order confirmed.</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ve received your payment. A confirmation for {order.orderNumber} is on its way.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.placedAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="space-y-6">
          <ul className="divide-y divide-border rounded-xl border border-border">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.variantId}`} className="flex gap-4 p-4">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-2xl">🥤</span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link href={`/products/${item.slug}`} className="font-medium hover:text-primary">
                    {item.name}
                  </Link>
                  {item.variantLabel && (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2 text-sm">
                    <span className="text-muted-foreground">
                      {formatINR(item.price)} × {item.qty}
                    </span>
                    <span className="font-semibold">{formatINR(item.lineTotal)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Timeline */}
          <div className="rounded-xl border border-border p-5">
            <h2 className="mb-3 font-display text-lg font-bold uppercase">Status timeline</h2>
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

        {/* Summary + address */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-display text-lg font-bold uppercase">Payment</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatINR(order.amounts.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{order.amounts.shipping === 0 ? "FREE" : formatINR(order.amounts.shipping)}</dd>
              </div>
              {order.amounts.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Discount</dt>
                  <dd>−{formatINR(order.amounts.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(order.amounts.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              {order.payment.status === "paid" ? "Paid" : "Payment " + order.payment.status} ·{" "}
              {order.payment.provider}
              {order.payment.mode === "stub" && " (test)"}
            </p>
          </div>

          <div className="rounded-xl border border-border p-6">
            <h2 className="font-display text-lg font-bold uppercase">Shipping to</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{order.address.name}</span>
              <br />
              {order.address.line1}
              {order.address.line2 && <>, {order.address.line2}</>}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
              <br />
              {order.address.country}
              <br />
              📞 {order.address.phone}
            </address>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href="/account/orders">All orders</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
