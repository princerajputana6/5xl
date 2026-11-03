/**
 * GTM dataLayer helpers. Events follow the GA4 ecommerce schema
 * (view_item, add_to_cart, begin_checkout, purchase) so GA4, Google Ads and
 * Meta Pixel tags in GTM can all read the same `ecommerce` object.
 */

type DataLayerEvent = Record<string, unknown>;

type WindowWithDataLayer = Window & { dataLayer?: DataLayerEvent[] };

export type AnalyticsItem = {
  productId: string;
  name: string;
  price: number;
  qty?: number;
  variantLabel?: string | null;
  brand?: string | null;
  category?: string | null;
};

const CURRENCY = "INR";
/** Must match the key used by the cookie consent banner. */
const CONSENT_KEY = "cookie-consent-v1";

function savedConsent(): string | undefined {
  try {
    return localStorage.getItem(CONSENT_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function pushDataLayer(event: DataLayerEvent) {
  if (typeof window === "undefined") return;
  try {
    const w = window as WindowWithDataLayer;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push(event);
  } catch {
    /* ignore */
  }
}

function toGa4Item(item: AnalyticsItem, index: number) {
  return {
    item_id: item.productId,
    item_name: item.name,
    item_variant: item.variantLabel ?? undefined,
    item_brand: item.brand ?? undefined,
    item_category: item.category ?? undefined,
    price: item.price,
    quantity: item.qty ?? 1,
    index,
  };
}

/** Push an ecommerce event, clearing the previous ecommerce object first (per GTM guidance). */
function trackEcommerce(
  event: string,
  items: AnalyticsItem[],
  extra: { value?: number; transaction_id?: string; shipping?: number; coupon?: string } = {}
) {
  const value =
    extra.value ?? items.reduce((sum, i) => sum + i.price * (i.qty ?? 1), 0);
  pushDataLayer({ ecommerce: null });
  pushDataLayer({
    event,
    // Carry the remembered consent on every event so consent-gated tags work
    // even if this fires before the cookie banner re-announces the choice.
    cookie_consent: savedConsent(),
    ecommerce: {
      currency: CURRENCY,
      value,
      ...extra,
      items: items.map(toGa4Item),
    },
  });
}

export function trackViewItem(item: AnalyticsItem) {
  trackEcommerce("view_item", [item]);
}

export function trackAddToCart(item: AnalyticsItem) {
  trackEcommerce("add_to_cart", [item]);
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number) {
  trackEcommerce("begin_checkout", items, { value });
}

export function trackPurchase(
  items: AnalyticsItem[],
  order: { transactionId: string; value: number; shipping: number; coupon?: string }
) {
  trackEcommerce("purchase", items, {
    transaction_id: order.transactionId,
    value: order.value,
    shipping: order.shipping,
    coupon: order.coupon,
  });
}
