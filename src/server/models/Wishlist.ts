import { Schema, type InferSchemaType } from "mongoose";
import { defineModel } from "@/server/db";

const WishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export type WishlistDoc = InferSchemaType<typeof WishlistSchema> & { _id: string };

export const Wishlist = defineModel<WishlistDoc>("Wishlist", WishlistSchema);
