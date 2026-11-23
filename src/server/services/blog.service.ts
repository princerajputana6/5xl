import { and, count, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { posts, type PostRow } from "@/server/schema";
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

function toCard(p: PostRow): PostCardDTO {
  return {
    title: p.title ?? "",
    slug: p.slug ?? "",
    excerpt: p.excerpt ?? "",
    coverImage: p.coverImage || null,
    category: p.category || "General",
    author: p.author || "The 5XL Nutrition",
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    readingMinutes: p.readingMinutes ?? 1,
  };
}

/* ------------------------------ public ------------------------------ */

export async function listPublishedPosts(params: {
  page?: number;
  q?: string;
  category?: string;
}): Promise<PostListResult> {
  const page = Math.max(1, params.page ?? 1);
  const conds = [eq(posts.status, "published")];
  if (params.category) conds.push(eq(posts.category, params.category));
  if (params.q) {
    const term = `%${params.q.trim()}%`;
    conds.push(or(like(posts.title, term), like(posts.excerpt, term), like(posts.tags, term))!);
  }
  const where = and(...conds);

  const [docs, totalRow] = await Promise.all([
    db()
      .select()
      .from(posts)
      .where(where)
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
      .all(),
    db().select({ n: count() }).from(posts).where(where).get(),
  ]);

  const total = totalRow?.n ?? 0;
  return {
    rows: docs.map(toCard),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function listPostCategories(): Promise<string[]> {
  const cats = await db()
    .selectDistinct({ category: posts.category })
    .from(posts)
    .where(eq(posts.status, "published"))
    .all();
  return cats.map((c) => c.category).filter(Boolean).sort();
}

export async function getPostBySlug(slug: string): Promise<PostDetailDTO | null> {
  const p = await db()
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .get();
  if (!p) return null;
  return {
    ...toCard(p),
    contentHtml: p.contentHtml ?? "",
    tags: p.tags ?? [],
    seo: { title: p.seo?.title ?? "", description: p.seo?.description ?? "" },
  };
}

export async function listRelatedPosts(
  slug: string,
  category: string,
  limit = 3
): Promise<PostCardDTO[]> {
  const docs = await db()
    .select()
    .from(posts)
    .where(and(eq(posts.status, "published"), ne(posts.slug, slug), eq(posts.category, category)))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .all();
  return docs.map(toCard);
}

/* ------------------------------ admin ------------------------------ */

export async function listPostsAdmin(
  params: { page?: number; pageSize?: number } = {}
): Promise<{ rows: PostAdminRow[]; total: number; page: number; pages: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  const [docs, totalRow] = await Promise.all([
    db()
      .select()
      .from(posts)
      .orderBy(desc(posts.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all(),
    db().select({ n: count() }).from(posts).get(),
  ]);

  const total = totalRow?.n ?? 0;
  const rows: PostAdminRow[] = docs.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category ?? "General",
    status: (p.status as "draft" | "published") ?? "published",
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : "",
  }));
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPostAdmin(id: string): Promise<(BlogPostInput & { id: string }) | null> {
  const p = await db().select().from(posts).where(eq(posts.id, id)).get();
  if (!p) return null;
  return {
    id: p.id,
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
  const existing = await db().select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).get();
  if (existing && existing.id !== excludeId) {
    throw new AdminError("Another post already uses that slug.", 409);
  }
}

function mapInput(input: BlogPostInput) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt ?? "",
    coverImage: input.coverImage ?? "",
    contentHtml: input.contentHtml ?? "",
    category: input.category ?? "General",
    tags: input.tags ?? [],
    author: input.author ?? "The 5XL Nutrition",
    seo: { title: input.seo?.title ?? "", description: input.seo?.description ?? "" },
  };
}

export async function createPost(input: BlogPostInput): Promise<string> {
  await assertUniqueSlug(input.slug);
  const status = input.status ?? "published";
  const [row] = await db()
    .insert(posts)
    .values({
      ...mapInput(input),
      status,
      readingMinutes: estimateReadingMinutes(input.contentHtml ?? ""),
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning({ id: posts.id });
  return row.id;
}

export async function updatePost(id: string, input: BlogPostInput): Promise<void> {
  await assertUniqueSlug(input.slug, id);
  const existing = await db()
    .select({ status: posts.status, publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, id))
    .get();
  if (!existing) throw new AdminError("Post not found.", 404);
  const status = input.status ?? existing.status ?? "published";
  const publishedAt =
    status === "published" ? existing.publishedAt ?? new Date() : existing.publishedAt;
  await db()
    .update(posts)
    .set({
      ...mapInput(input),
      status,
      publishedAt,
      readingMinutes: estimateReadingMinutes(input.contentHtml ?? ""),
    })
    .where(eq(posts.id, id));
}

export async function deletePost(id: string): Promise<void> {
  await db().delete(posts).where(eq(posts.id, id));
}
