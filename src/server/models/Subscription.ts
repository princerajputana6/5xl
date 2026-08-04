import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    image: { type: String, default: null },
    variantId: { type: String, default: null },
    variantLabel: { type: String, default: null },
    price: { type: Number, required: true }, // per-unit before subscription discount
    qty: { type: Number, default: 1, min: 1 },
    intervalDays: { type: Number, enum: [30, 60, 90], default: 30 },
    discountPct: { type: Number, default: 10 },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
      index: true,
    },
    nextDeliveryAt: { type: Date },
  },
  { timestamps: true }
);

export type SubscriptionDoc = InferSchemaType<typeof SubscriptionSchema> & { _id: string };

export const Subscription: Model<SubscriptionDoc> =
  (models.Subscription as Model<SubscriptionDoc>) ??
  model<SubscriptionDoc>("Subscription", SubscriptionSchema);
