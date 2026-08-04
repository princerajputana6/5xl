import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

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

export const Brand: Model<BrandDoc> =
  (models.Brand as Model<BrandDoc>) ?? model<BrandDoc>("Brand", BrandSchema);
