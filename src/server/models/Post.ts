import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/**
 * Blog post / article. Content is stored as HTML (authored in the admin editor
 * or brought in by the migration importer). Public reads are limited to
 * `status: "published"`.
 */
const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String },
    coverImage: { type: String },
    contentHtml: { type: String, default: "" },
    category: { type: String, default: "General", trim: true },
    tags: { type: [String], default: [] },
    author: { type: String, default: "The 5XL Nutrition", trim: true },
    status: { type: String, enum: ["draft", "published"], default: "published", index: true },
    publishedAt: { type: Date },
    readingMinutes: { type: Number, default: 1 },
    seo: {
      title: String,
      description: String,
    },
    /** Original URL when migrated from the legacy site. */
    sourceUrl: { type: String },
  },
  { timestamps: true }
);

PostSchema.index({ status: 1, publishedAt: -1 });

export type PostDoc = InferSchemaType<typeof PostSchema> & { _id: string };

export const Post: Model<PostDoc> =
  (models.Post as Model<PostDoc>) ?? model<PostDoc>("Post", PostSchema);
