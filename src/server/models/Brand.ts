import { Schema, type InferSchemaType } from "mongoose";
import { defineModel } from "@/server/db";

const BrandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
    seo: {
      title: String,
      description: String,
    },
  },
  { timestamps: true }
);

export type BrandDoc = InferSchemaType<typeof BrandSchema> & { _id: string };

export const Brand = defineModel<BrandDoc>("Brand", BrandSchema);
