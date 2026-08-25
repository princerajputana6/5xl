"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShoppingBag, ShieldCheck, Lock, Tag, X, AlertCircle } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { AddressBook } from "@/components/shop/address-book";
import { computeAmounts } from "@/lib/cart-pricing";
import { formatINR } from "@/lib/format";
import { ProductImage } from "@/components/shop/product-image";
import type { CheckoutSession } from "@/types/order";
import type { SavedAddress } from "@/server/services/address.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type VerifyPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/** Load Razorpay Checkout script once (live mode only). */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutClient({
  savedAddresses,
  defaultName,
  stubMode,
  rewardPoints,
}: {
  savedAddresses: SavedAddress[];
  defaultName: string;
  stubMode: boolean;
  rewardPoints: number;
}) {
  const router = useRouter();
  const { items, subtotal, isHydrated, clear } = useCart();
  const [pending, setPending] = React.useState(false);
  const [stubSession, setStubSession] = React.useState<CheckoutSession | null>(null);

  // Address book state. The list is refetched after any add/edit/delete so the
  // cards stay in step with what's actually stored on the account.
  const [addresses, setAddresses] = React.useState<SavedAddress[]>(savedAddresses);
  const [selectedAddress, setSelectedAddress] = React.useState<SavedAddress | null>(
    savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null
  );

  const refreshAddresses = React.useCallback(async () => {
    const res = await fetch("/api/addresses");
    if (!res.ok) return;
    const data: { addresses: SavedAddress[] } = await res.json();
    setAddresses(data.addresses);
    setSelectedAddress((current) => {
      if (!current) return data.addresses.find((a) => a.isDefault) ?? data.addresses[0] ?? null;
      // Keep the current pick, refreshed — or fall back if it was deleted.
      return (
        data.addresses.find((a) => a.id === current.id) ??
        data.addresses.find((a) => a.isDefault) ??
        data.addresses[0] ??
        null
      );
    });
  }, []);

  // Coupon state
  const [couponDraft, setCouponDraft] = React.useState("");
  const [couponPending, setCouponPending] = React.useState(false);
  const [coupon, setCoupon] = React.useState<{
    code: string;
    discount: number;
    label: string;
  } | null>(null);

  // Reward points redemption (all-or-nothing toggle; 1 point = ₹1).
  const [usePoints, setUsePoints] = React.useState(false);
  const redeemablePoints = Math.min(
    rewardPoints,
    Math.max(0, subtotal - (coupon?.discount ?? 0))
  );
  const pointsRedeemed = usePoints ? redeemablePoints : 0;

  const amounts = computeAmounts(subtotal, coupon?.discount ?? 0, pointsRedeemed);

  async function applyCoupon() {
    const code = couponDraft.trim();
    if (!code) return;
    setCouponPending(true);
    const res = await fetch("/api/coupons/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          qty: i.qty,
        })),
      }),
    });
    const data = await res.json();
    setCouponPending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not apply coupon.");
      return;
    }
    setCoupon({ code: data.code, discount: data.discount, label: data.label });
    toast.success(`Coupon ${data.code} applied — ${data.label}.`);
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponDraft("");
  }

  // --- payment steps ----------------------------------------------------

  async function verifyAndFinish(payload: VerifyPayload, orderNumber: string) {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Payment verification failed.");
      setPending(false);
      return;
    }
    clear();
    toast.success("Payment successful — order confirmed!");
    router.push(`/account/orders/${orderNumber}?placed=1`);
  }

  async function launchLive(session: CheckoutSession) {
    const ok = await loadRazorpayScript();
    if (!ok) {
      toast.error("Couldn't reach the payment gateway. Please retry.");
      setPending(false);
      return;
    }
    const RZP = (window as unknown as { Razorpay: new (o: unknown) => { open: () => void } })
      .Razorpay;
    const rzp = new RZP({
      key: session.keyId,
      order_id: session.gatewayOrderId,
      amount: session.amount,
      currency: session.currency,
      name: "5XL Nutrition",
      description: `Order ${session.orderNumber}`,
      handler: (resp: VerifyPayload) => verifyAndFinish(resp, session.orderNumber),
      modal: { ondismiss: () => setPending(false) },
      theme: { color: "#000000" },
    });
    rzp.open();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;

    if (!selectedAddress) {
      toast.error("Add a shipping address to continue.");
      return;
    }

    // Strip the client-only fields before sending; the API validates the rest.
    const { id: _id, isDefault: _isDefault, ...address } = selectedAddress;
    void _id;
    void _isDefault;

    setPending(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          qty: i.qty,
        })),
        address,
        saveAddress: false, // already stored in the address book
        couponCode: coupon?.code,
        redeemPoints: pointsRedeemed,
      }),
    });
    const session: CheckoutSession & { error?: string } = await res.json();
    if (!res.ok) {
      toast.error(session.error ?? "Could not start checkout.");
      setPending(false);
      return;
    }

    if (session.stub) {
      // Stand-in for the hosted Checkout widget.
      setStubSession(session);
    } else {
      await launchLive(session);
    }
  }

  async function confirmStubPayment() {
    if (!stubSession) return;
    const session = stubSession;
    setStubSession(null);

    const res = await fetch("/api/payments/mock-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gatewayOrderId: session.gatewayOrderId }),
    });
    const payload: VerifyPayload & { error?: string } = await res.json();
    if (!res.ok) {
      toast.error(payload.error ?? "Mock payment failed.");
      setPending(false);
      return;
    }
    await verifyAndFinish(payload, session.orderNumber);
  }

  function cancelStubPayment() {
    setStubSession(null);
    setPending(false);
    toast.info("Payment cancelled. Your order is saved as pending.");
  }

  // --- render -----------------------------------------------------------

  if (!isHydrated) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-10" />}
        title="Nothing to check out"
        description="Add items to your cart first."
        actionLabel="Shop products"
        actionHref="/products"
      />
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        {/* Address */}
        <section className="space-y-4">
          <div className="rounded-xl border border-border p-6">
            <h2 className="mb-1 font-display text-xl font-bold uppercase">Shipping address</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Pick where this order should go, or add a new address.
            </p>

            <AddressBook
              addresses={addresses}
              selectedId={selectedAddress?.id ?? null}
              onSelect={setSelectedAddress}
              onChanged={refreshAddresses}
              defaultName={defaultName}
            />

            {!selectedAddress && addresses.length > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="size-4" />
                Select an address to continue.
              </p>
            )}
          </div>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" /> Payments are processed securely by Razorpay.
          </p>
        </section>

        {/* Summary */}
        <aside className="h-fit rounded-xl border border-border p-6">
          <h2 className="font-display text-xl font-bold uppercase">Order summary</h2>

          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  <ProductImage src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {item.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  {item.variantLabel && (
                    <p className="truncate text-xs text-muted-foreground">{item.variantLabel}</p>
                  )}
                </div>
                <span className="text-sm font-semibold">{formatINR(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>

          {/* Coupon */}
          <div className="mt-5 border-t border-border pt-4">
            {coupon ? (
              <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <Tag className="size-4 text-primary" /> {coupon.code}
                  <span className="text-muted-foreground">· {coupon.label}</span>
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  aria-label="Remove coupon"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponDraft}
                  onChange={(e) => setCouponDraft(e.target.value.toUpperCase())}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), applyCoupon())
                  }
                  placeholder="Coupon code"
                  className="uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyCoupon}
                  disabled={couponPending || !couponDraft.trim()}
                >
                  {couponPending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
          </div>

          {/* Reward points */}
          {rewardPoints > 0 && (
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
              <span className="flex items-center gap-2">
                <Checkbox
                  checked={usePoints}
                  disabled={redeemablePoints <= 0}
                  onCheckedChange={(v) => setUsePoints(Boolean(v))}
                />
                Redeem {rewardPoints} points
              </span>
              <span className="text-muted-foreground">−{formatINR(redeemablePoints)}</span>
            </label>
          )}

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(amounts.subtotal)}</dd>
            </div>
            {coupon && amounts.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Discount ({coupon.code})</dt>
                <dd>−{formatINR(amounts.discount)}</dd>
              </div>
            )}
            {amounts.pointsRedeemed > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Points redeemed</dt>
                <dd>−{formatINR(amounts.pointsRedeemed)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{amounts.shipping === 0 ? "FREE" : formatINR(amounts.shipping)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatINR(amounts.total)}</dd>
            </div>
          </dl>

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending}>
            {pending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Lock className="mr-2 size-4" />
            )}
            Pay {formatINR(amounts.total)}
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/cart">Back to cart</Link>
          </Button>
        </aside>
      </form>

      {/* Stub payment stand-in (no real keys configured) */}
      <Dialog open={Boolean(stubSession)} onOpenChange={(o) => !o && cancelStubPayment()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test payment</DialogTitle>
            <DialogDescription>
              Razorpay keys aren&apos;t configured, so this is a simulated gateway. In
              production the real Razorpay Checkout opens here. Confirm to complete a
              successful test payment of{" "}
              <span className="font-semibold text-foreground">{formatINR(amounts.total)}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelStubPayment}>
              Cancel
            </Button>
            <Button onClick={confirmStubPayment}>Simulate successful payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
