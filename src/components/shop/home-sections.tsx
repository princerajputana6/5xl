import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeSectionDTO } from "@/server/services/home.service";
import type { ProductCardDTO } from "@/types/catalog";
import {
  getFeaturedProducts,
  getBestsellers,
  getProductsBySlugs,
  getProductsByCategorySlug,
} from "@/server/services/catalog.service";
import { listActiveCategories, type PublicCategory } from "@/server/services/category.service";
import { ProductCard } from "@/components/shop/product-card";
import { CategoryGrid } from "@/components/shop/category-grid";
import { VideoSlider, type VideoSlide } from "@/components/shop/video-slider";
import { TestimonialsSection } from "@/components/shop/testimonials-section";
import { Reveal } from "@/components/fx/scroll-fx";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

type ResolvedCard = {
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  href: string;
  ctaLabel: string;
  price: number | null;
  mrp: number | null;
};

/** Section heading matching the storefront look: accent bar + optional link. */
function SectionHeading({
  title,
  description,
  href,
}: {
  title?: string;
  description?: string;
  href?: string;
}) {
  if (!title && !description) return null;
  return (
    <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-7 w-1.5 shrink-0 rounded-full bg-primary md:h-9" />
        <div>
          {title && (
            <h2 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight md:text-4xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-1 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground sm:inline-flex"
        >
          View all
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function ProductRow({
  products,
  layout,
}: {
  products: ProductCardDTO[];
  layout: "grid" | "carousel";
}) {
  if (layout === "carousel") {
    return (
      <div
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {products.map((p) => (
          <div key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

/** Horizontal slider of promo cards, each optionally tied to a product. */
function CardSlider({ cards }: { cards: ResolvedCard[] }) {
  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      )}
    >
      {cards.map((c, i) => {
        const inner = (
          <>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid size-full place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
                  <span className="font-display text-2xl font-extrabold uppercase text-primary/40">5XL</span>
                </div>
              )}
              {c.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
                  {c.badge}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              {c.title && (
                <p className="font-display text-base font-bold uppercase leading-tight tracking-tight">
                  {c.title}
                </p>
              )}
              {c.subtitle && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.subtitle}</p>
              )}
              {c.price != null && (
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-lg font-extrabold">{formatINR(c.price)}</span>
                  {c.mrp != null && c.mrp > c.price && (
                    <span className="text-xs text-muted-foreground line-through">{formatINR(c.mrp)}</span>
                  )}
                </p>
              )}
              {(c.ctaLabel || c.href) && (
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {c.ctaLabel || "Shop now"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </div>
          </>
        );
        const cls =
          "group flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 sm:w-64";
        return c.href ? (
          <Link key={i} href={c.href} className={cls}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

type Resolved = {
  section: HomeSectionDTO;
  products?: ProductCardDTO[];
  categories?: PublicCategory[];
  videos?: VideoSlide[];
  cards?: ResolvedCard[];
};

async function resolve(s: HomeSectionDTO): Promise<Resolved> {
  const limit = s.limit || 8;
  if (s.type === "products") {
    let products: ProductCardDTO[] = [];
    if (s.productSource === "featured") products = await getFeaturedProducts(limit);
    else if (s.productSource === "bestsellers") products = await getBestsellers(limit);
    else if (s.productSource === "category")
      products = await getProductsByCategorySlug(s.categorySlug, limit);
    else products = (await getProductsBySlugs(s.productSlugs)).slice(0, limit);
    return { section: s, products };
  }
  if (s.type === "cards") {
    const slugs = s.cards.map((c) => c.productSlug).filter(Boolean);
    const prods = await getProductsBySlugs(slugs);
    const bySlug = new Map(prods.map((p) => [p.slug, p]));
    const cards: ResolvedCard[] = s.cards
      .map((c) => {
        const p = c.productSlug ? bySlug.get(c.productSlug) ?? null : null;
        return {
          image: c.image || p?.image || "",
          title: c.title || p?.name || "",
          subtitle: c.subtitle,
          badge: c.badge,
          href: c.href || (p ? `/products/${p.slug}` : s.viewAllHref || ""),
          ctaLabel: c.ctaLabel,
          price: p?.price ?? null,
          mrp: p?.mrp ?? null,
        };
      })
      .filter((c) => c.image || c.title);
    return { section: s, cards };
  }
  if (s.type === "categories") {
    const categories = await listActiveCategories(
      s.categorySlugs.length ? s.categorySlugs : undefined
    );
    return { section: s, categories };
  }
  if (s.type === "video") {
    const slugs = s.videos.map((v) => v.productSlug).filter(Boolean);
    const prods = await getProductsBySlugs(slugs);
    const bySlug = new Map(prods.map((p) => [p.slug, p]));
    const videos: VideoSlide[] = s.videos
      .filter((v) => v.url)
      .map((v) => ({
        url: v.url,
        poster: v.poster,
        caption: v.caption,
        product: v.productSlug ? bySlug.get(v.productSlug) ?? null : null,
      }));
    return { section: s, videos };
  }
  return { section: s };
}

/** Renders the admin-managed, ordered homepage sections. */
export async function HomeSections({ sections }: { sections: HomeSectionDTO[] }) {
  const active = sections.filter((s) => s.enabled);
  if (active.length === 0) return null;

  const resolved = await Promise.all(active.map(resolve));

  return (
    <>
      {resolved.map(({ section: s, products, categories, videos, cards }, idx) => {
        // Skip sections with no content to show.
        if (s.type === "products" && (!products || products.length === 0)) return null;
        if (s.type === "cards" && (!cards || cards.length === 0)) return null;
        if (s.type === "categories" && (!categories || categories.length === 0)) return null;
        if (s.type === "video" && (!videos || videos.length === 0)) return null;
        if (s.type === "testimonials" && s.testimonials.length === 0) return null;
        if (s.type === "banner" && !s.image && !s.title) return null;
        if (s.type === "richtext" && !s.html) return null;

        const alt = idx % 2 === 1;

        // Banner spans edge-to-edge with its own styling.
        if (s.type === "banner") {
          const inner = (
            <div className="relative overflow-hidden rounded-3xl">
              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.title || "Banner"} className="h-56 w-full object-cover md:h-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 text-white md:p-10">
                {s.title && (
                  <h2 className="max-w-lg font-display text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-5xl">
                    {s.title}
                  </h2>
                )}
                {s.description && <p className="max-w-md text-white/85">{s.description}</p>}
                {s.ctaLabel && s.ctaHref && (
                  <Link
                    href={s.ctaHref}
                    className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    {s.ctaLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
            </div>
          );
          return (
            <section key={s.id} className="container-5xl py-7 md:py-10">
              <Reveal>{inner}</Reveal>
            </section>
          );
        }

        return (
          <section
            key={s.id}
            className={cn("py-7 md:py-10", alt && "border-y border-border bg-muted/30")}
          >
            <div className="container-5xl">
              <Reveal>
                <SectionHeading
                  title={s.title}
                  description={s.description}
                  href={s.viewAllHref || undefined}
                />
              </Reveal>
              <Reveal delay={0.05}>
                {s.type === "products" && products && (
                  <ProductRow products={products} layout={s.layout} />
                )}
                {s.type === "cards" && cards && <CardSlider cards={cards} />}
                {s.type === "categories" && categories && (
                  <CategoryGrid categories={categories} />
                )}
                {s.type === "video" && videos && <VideoSlider slides={videos} />}
                {s.type === "testimonials" && (
                  <TestimonialsSection items={s.testimonials} />
                )}
                {s.type === "richtext" && (
                  <div
                    className="prose prose-neutral max-w-3xl dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: s.html }}
                  />
                )}
              </Reveal>
            </div>
          </section>
        );
      })}
    </>
  );
}
