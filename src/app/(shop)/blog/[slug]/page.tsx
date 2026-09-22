import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, ArrowLeft } from "lucide-react";
import { getPostBySlug, listRelatedPosts } from "@/server/services/blog.service";
import { formatDate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.seo.title || post.title,
    description: post.seo.description || post.excerpt || undefined,
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await listRelatedPosts(post.slug, post.category, 3);

  return (
    <article className="container-5xl py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/blog" className="hover:text-foreground">Blog</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{post.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {post.category}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{post.author}</span>
          {post.publishedAt && (
            <>
              <span aria-hidden>·</span>
              <span>{formatDate(post.publishedAt)}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {post.readingMinutes} min read
          </span>
        </div>

        {post.coverImage && (
          <div className="mt-6 overflow-hidden rounded-2xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        {post.contentHtml ? (
          <div
            className="blog-content mt-8"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        ) : (
          post.excerpt && <p className="mt-8 text-lg text-muted-foreground">{post.excerpt}</p>
        )}

        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to all articles
          </Link>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto mt-14 max-w-5xl border-t border-border pt-10">
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight">
            Related reads
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/50"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {r.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.coverImage}
                      alt={r.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid size-full place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
                      <span className="font-display text-xl font-extrabold uppercase text-primary/40">
                        5XL
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base font-bold uppercase leading-tight tracking-tight">
                    {r.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
