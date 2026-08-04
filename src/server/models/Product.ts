import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const VariantSchema = new Schema(
  {
    label: { type: String, required: true }, // e.g. "1kg · Chocolate"
    flavour: { type: String },
    size: { type: String }, // e.g. "1kg", "60 caps"
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const NutritionRowSchema = new Schema(
  { label: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true },
    shortDescription: { type: String },
    description: { type: String },

    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },

    images: { type: [String], default: [] },

    // Base pricing (mirrors the default/first variant for fast listing sorts)
    price: { type: Number, required: true, min: 0, index: true },
    mrp: { type: Number, required: true, min: 0 },
    gstPct: { type: Number, default: 18 },

    variants: { type: [VariantSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 }, // aggregate for simple products

    nutritionFacts: { type: [NutritionRowSchema], default: [] },
    ingredients: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    usage: { type: String },

    tags: { type: [String], default: [], index: true },
    goals: { type: [String], default: [] }, // muscle | fat-loss | performance | wellness

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "active", "archived"], default: "active", index: true },

    seo: { title: String, description: String },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", shortDescription: "text", tags: "text" });
ProductSchema.index({ createdAt: -1 });

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: string };

export const Product: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ??
  model<ProductDoc>("Product", ProductSchema);
