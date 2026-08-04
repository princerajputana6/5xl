import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    image: { type: String },
    emoji: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seo: {
      title: String,
      description: String,
    },
  },
  { timestamps: true }
);

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: string };

export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) ??
  model<CategoryDoc>("Category", CategorySchema);
