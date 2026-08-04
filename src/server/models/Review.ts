import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const ReviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    body: { type: String, required: true },
    images: { type: [String], default: [] },
    isVerifiedPurchase: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    reply: { body: String, repliedAt: Date },
  },
  { timestamps: true }
);

export type ReviewDoc = InferSchemaType<typeof ReviewSchema> & { _id: string };

export const Review: Model<ReviewDoc> =
  (models.Review as Model<ReviewDoc>) ?? model<ReviewDoc>("Review", ReviewSchema);
