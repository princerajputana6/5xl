import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const WishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export type WishlistDoc = InferSchemaType<typeof WishlistSchema> & { _id: string };

export const Wishlist: Model<WishlistDoc> =
  (models.Wishlist as Model<WishlistDoc>) ??
  model<WishlistDoc>("Wishlist", WishlistSchema);
