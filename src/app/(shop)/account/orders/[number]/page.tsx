import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Receipt,
  History,
  Phone,
  Tag,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUserOrderByNumber } from "@/server/services/order.service";
import { formatINR, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { OrderProgress } from "@/components/shop/order-progress";
import { ProductImage } from "@/components/shop/product-image";
import { CancelOrderButton } from "@/components/shop/cancel-order-button";
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
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
  const isUnpaid = order.status === "pending" && order.payment.status !== "paid";

  return (
    <div className="container-5xl py-10">
      <Link
        href="/account/orders"
        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
        All orders
      </Link>

      {justPlaced && (
        <div className="animate-in fade-in zoom-in-95 mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 duration-500 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <CheckCircle2 className="mt-0.5 size-7 shrink-0 animate-in zoom-in-50 text-emerald-600 duration-700 dark:text-emerald-400" />
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
          <p className="text-sm text-muted-foreground">
            Placed {formatDate(order.placedAt)} · {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6">
        <OrderProgress status={order.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ---- Items + timeline ---- */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-tight">
              Items in this order
            </h2>
            <ul className="space-y-3">
              {order.items.map((item, i) => (
                <li
                  key={`${item.productId}-${item.variantId}`}
                  style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
                  className="group animate-in fade-in slide-in-from-bottom-2 flex gap-4 rounded-xl border border-border bg-card p-4 duration-500 fill-mode-backwards transition-colors hover:border-primary/60"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      className="line-clamp-2 font-medium leading-snug hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.variantLabel}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2 text-sm">
                      <span className="text-muted-foreground">
                        {formatINR(item.price)} × {item.qty}
                      </span>
                      <span className="font-display text-base font-bold">
                        {formatINR(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight">
              <History className="size-4 text-primary" />
              Status timeline
            </h2>

            <ol className="mt-5 space-y-5">
              {order.timeline.map((t, i) => {
                const isLatest = i === order.timeline.length - 1;
                return (
                  <li key={i} className="relative flex gap-4 text-sm">
                    {/* Connector to the next entry */}
                    {i < order.timeline.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[0.4375rem] top-4 h-[calc(100%+0.6rem)] w-px bg-border"
                      />
                    )}
                    <span
                      className={cnDot(isLatest)}
                      aria-hidden
                    />
                    <div className="-mt-0.5">
                      <p className="font-semibold capitalize">{t.status}</p>
                      {t.note && <p className="text-muted-foreground">{t.note}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(t.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        {/* ---- Payment + address ---- */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />

            <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight">
              <Receipt className="size-4 text-primary" />
              Payment
            </h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatINR(order.amounts.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className={order.amounts.shipping === 0 ? "font-semibold text-success" : ""}>
                  {order.amounts.shipping === 0 ? "FREE" : formatINR(order.amounts.shipping)}
                </dd>
              </div>
              {order.amounts.discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt className="flex items-center gap-1.5">
                    <Tag className="size-3.5" /> Discount
                  </dt>
                  <dd>−{formatINR(order.amounts.discount)}</dd>
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-border pt-3">
                <dt className="font-display text-base font-bold uppercase">Total</dt>
                <dd className="font-display text-2xl font-extrabold">
                  {formatINR(order.amounts.total)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <span
                className={
                  order.payment.status === "paid"
                    ? "font-semibold text-success"
                    : "font-semibold text-foreground"
                }
              >
                {order.payment.status === "paid" ? "Paid" : `Payment ${order.payment.status}`}
              </span>
              · {order.payment.provider}
              {order.payment.mode === "stub" && " (test)"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight">
              <MapPin className="size-4 text-primary" />
              Shipping to
            </h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{order.address.name}</span>
              <br />
              {order.address.line1}
              {order.address.line2 && <>, {order.address.line2}</>}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
              <br />
              {order.address.country}
            </address>
            <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm">
              <Phone className="size-3.5 text-muted-foreground" />
              {order.address.phone}
            </p>
          </div>

          {isUnpaid && (
            <CancelOrderButton orderNumber={order.orderNumber} className="w-full" />
          )}

          <Button asChild variant="outline" className="w-full">
            <Link href="/products">Buy these again</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

/** Timeline bullet — the most recent entry gets the brand ring. */
function cnDot(isLatest: boolean): string {
  return [
    "relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 bg-background",
    isLatest ? "border-primary bg-primary ring-4 ring-primary/20" : "border-border",
  ].join(" ");
}
