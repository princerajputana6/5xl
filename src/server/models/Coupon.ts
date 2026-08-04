import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, default: "" },

    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 }, // % for percent, ₹ for flat

    minOrder: { type: Number, default: 0, min: 0 }, // min subtotal to qualify
    maxDiscount: { type: Number, default: 0, min: 0 }, // cap for percent (0 = no cap)

    usageLimit: { type: Number, default: 0, min: 0 }, // total uses (0 = unlimited)
    usedCount: { type: Number, default: 0, min: 0 },

    startsAt: { type: Date },
    expiresAt: { type: Date },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export type CouponDoc = InferSchemaType<typeof CouponSchema> & { _id: string };

export const Coupon: Model<CouponDoc> =
  (models.Coupon as Model<CouponDoc>) ?? model<CouponDoc>("Coupon", CouponSchema);
