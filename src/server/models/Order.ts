import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/** Line item — a snapshot taken at purchase time (never re-read from Product). */
const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: null },
    variantId: { type: String, default: null },
    variantLabel: { type: String, default: null },
    price: { type: Number, required: true, min: 0 }, // unit price paid
    mrp: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/** Shipping address snapshot (decoupled from the mutable Address collection). */
const OrderAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    provider: { type: String, default: "razorpay" },
    mode: { type: String, enum: ["live", "stub"], default: "stub" },
    gatewayOrderId: { type: String, index: true }, // razorpay order_id
    paymentId: { type: String }, // razorpay payment_id
    signature: { type: String },
    method: { type: String }, // upi / card / netbanking …
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      index: true,
    },
    paidAt: { type: Date },
  },
  { _id: false }
);

const TimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const ORDER_STATUSES = [
  "pending", // created, awaiting payment
  "confirmed", // payment captured
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    items: { type: [OrderItemSchema], required: true },

    amounts: {
      subtotal: { type: Number, required: true, min: 0 },
      shipping: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      pointsRedeemed: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "INR" },
    },

    couponCode: { type: String },
    pointsUsed: { type: Number, default: 0, min: 0 }, // reward points spent (1pt = ₹1)

    address: { type: OrderAddressSchema, required: true },
    payment: { type: PaymentSchema, default: () => ({}) },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    timeline: { type: [TimelineSchema], default: [] },

    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: string };

export const Order: Model<OrderDoc> =
  (models.Order as Model<OrderDoc>) ?? model<OrderDoc>("Order", OrderSchema);
