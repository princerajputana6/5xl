import type { Metadata } from "next";
import Link from "next/link";
import { Search, Clock, ArrowRight } from "lucide-react";
import { listPublishedPosts, listPostCategories } from "@/server/services/blog.service";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, comparisons and answers on protein, creatine, supplements and training from The 5XL Nutrition.",
};

type SP = { page?: string; q?: string; category?: string };

function buildHref(base: SP, patch: Partial<SP>): string {
  const sp = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v && k !== "page") sp.set(k, v);
  }
  if (patch.page && Number(patch.page) > 1) sp.set("page", String(patch.page));
  const qs = sp.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, categories] = await Promise.all([
    listPublishedPosts({ page, q: sp.q, category: sp.category }),
    listPostCategories(),
  ]);

  return (
    <div className="container-5xl py-10 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
          The 5XL Blog
        </h1>
        <p className="mt-1 text-muted-foreground">
          Evidence-based guides on protein, creatine, training and recovery.
        </p>
      </header>

      {/* Search */}
      <form action="/blog" className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search articles…"
          className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
      </form>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={buildHref(sp, { category: undefined, page: undefined })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              !sp.category
                ? "border-primary bg-primary/10 font-medium"
                : "border-border text-muted-foreground hover:border-foreground/40"
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={buildHref(sp, { category: c, page: undefined })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                sp.category === c
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              )}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {result.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No articles found{sp.q ? ` for “${sp.q}”` : ""}.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.rows.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid size-full place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
                    <span className="font-display text-2xl font-extrabold uppercase text-primary/40">
                      5XL
                    </span>
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold">
                  {post.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-lg font-bold uppercase leading-tight tracking-tight">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.publishedAt ? formatDate(post.publishedAt) : ""}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {post.readingMinutes} min
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={buildHref(sp, { page: String(page - 1) })}
              className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {result.pages}
          </span>
          {page < result.pages && (
            <Link
              href={buildHref(sp, { page: String(page + 1) })}
              className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Next <ArrowRight className="size-4" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
