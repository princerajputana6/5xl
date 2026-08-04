import type { Amounts } from "@/lib/cart-pricing";

export type OrderItemDTO = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  variantId: string | null;
  variantLabel: string | null;
  price: number;
  mrp: number;
  qty: number;
  lineTotal: number;
};

export type OrderAddressDTO = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type OrderDTO = {
  id: string;
  orderNumber: string;
  items: OrderItemDTO[];
  amounts: Amounts;
  address: OrderAddressDTO;
  couponCode: string | null;
  pointsUsed: number;
  status: OrderStatus;
  payment: {
    provider: string;
    mode: "live" | "stub";
    status: "created" | "paid" | "failed";
    method: string | null;
    paidAt: string | null;
  };
  timeline: { status: string; note?: string; at: string }[];
  placedAt: string;
};

/** Payload returned to the browser to launch payment. */
export type CheckoutSession = {
  orderId: string;
  orderNumber: string;
  gatewayOrderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  stub: boolean;
};
