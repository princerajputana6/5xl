import { connectDB } from "@/server/db";
import { Post } from "@/server/models/Post";
import type { BlogPostInput } from "@/lib/validators/blog";
import { AdminError } from "@/server/services/admin.service";

const PAGE_SIZE = 12;

export type PostCardDTO = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  author: string;
  publishedAt: string | null;
  readingMinutes: number;
};

export type PostDetailDTO = PostCardDTO & {
  contentHtml: string;
  tags: string[];
  seo: { title: string; description: string };
};

export type PostListResult = {
  rows: PostCardDTO[];
  total: number;
  page: number;
  pages: number;
};

export type PostAdminRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
};

function estimateReadingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function toCard(p: Record<string, unknown>): PostCardDTO {
  return {
    title: String(p.title ?? ""),
    slug: String(p.slug ?? ""),
    excerpt: (p.excerpt as string) ?? "",
    coverImage: (p.coverImage as string) || null,
    category: (p.category as string) || "General",
    author: (p.author as string) || "The 5XL Nutrition",
    publishedAt: p.publishedAt ? new Date(p.publishedAt as string).toISOString() : null,
    readingMinutes: typeof p.readingMinutes === "number" ? (p.readingMinutes as number) : 1,
  };
}

/* ------------------------------ public ------------------------------ */

export async function listPublishedPosts(params: {
  page?: number;
  q?: string;
  category?: string;
}): Promise<PostListResult> {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const filter: Record<string, unknown> = { status: "published" };
  if (params.category) filter.category = params.category;
  if (params.q) {
    const rx = new RegExp(params.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }];
  }

  const [docs, total] = await Promise.all([
    Post.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return {
    rows: docs.map(toCard),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function listPostCategories(): Promise<string[]> {
  await connectDB();
  const cats = await Post.distinct("category", { status: "published" });
  return (cats as string[]).filter(Boolean).sort();
}

export async function getPostBySlug(slug: string): Promise<PostDetailDTO | null> {
  await connectDB();
  const p = await Post.findOne({ slug, status: "published" }).lean();
  if (!p) return null;
  const doc = p as Record<string, unknown>;
  return {
    ...toCard(doc),
    contentHtml: (doc.contentHtml as string) ?? "",
    tags: (doc.tags as string[]) ?? [],
    seo: {
      title: (doc.seo as { title?: string })?.title ?? "",
      description: (doc.seo as { description?: string })?.description ?? "",
    },
  };
}

export async function listRelatedPosts(
  slug: string,
  category: string,
  limit = 3
): Promise<PostCardDTO[]> {
  await connectDB();
  const docs = await Post.find({ status: "published", slug: { $ne: slug }, category })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toCard);
}

/* ------------------------------ admin ------------------------------ */

export async function listPostsAdmin(): Promise<PostAdminRow[]> {
  await connectDB();
  const docs = await Post.find({}).sort({ updatedAt: -1 }).lean();
  return docs.map((p) => ({
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    category: p.category ?? "General",
    status: (p.status as "draft" | "published") ?? "published",
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : "",
  }));
}

export async function getPostAdmin(id: string): Promise<(BlogPostInput & { id: string }) | null> {
  await connectDB();
  const p = await Post.findById(id).lean();
  if (!p) return null;
  return {
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? "",
    coverImage: p.coverImage ?? "",
    contentHtml: p.contentHtml ?? "",
    category: p.category ?? "General",
    tags: p.tags ?? [],
    author: p.author ?? "The 5XL Nutrition",
    status: (p.status as "draft" | "published") ?? "published",
    seo: { title: p.seo?.title ?? "", description: p.seo?.description ?? "" },
  };
}

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await Post.findOne({ slug }).select("_id").lean();
  if (existing && String(existing._id) !== excludeId) {
    throw new AdminError("Another post already uses that slug.", 409);
  }
}

export async function createPost(input: BlogPostInput): Promise<string> {
  await connectDB();
  await assertUniqueSlug(input.slug);
  const status = input.status ?? "published";
  const doc = await Post.create({
    ...input,
    status,
    readingMinutes: estimateReadingMinutes(input.contentHtml ?? ""),
    publishedAt: status === "published" ? new Date() : undefined,
  });
  return String(doc._id);
}

export async function updatePost(id: string, input: BlogPostInput): Promise<void> {
  await connectDB();
  await assertUniqueSlug(input.slug, id);
  const existing = await Post.findById(id).select("status publishedAt").lean();
  if (!existing) throw new AdminError("Post not found.", 404);
  const status = input.status ?? existing.status ?? "published";
  const publishedAt =
    status === "published" ? existing.publishedAt ?? new Date() : existing.publishedAt;
  const res = await Post.updateOne(
    { _id: id },
    {
      $set: {
        ...input,
        status,
        publishedAt,
        readingMinutes: estimateReadingMinutes(input.contentHtml ?? ""),
      },
    }
  );
  if (res.matchedCount === 0) throw new AdminError("Post not found.", 404);
}

export async function deletePost(id: string): Promise<void> {
  await connectDB();
  await Post.deleteOne({ _id: id });
}
