import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts, getBestsellers } from "@/server/services/catalog.service";
import { listActiveCategories } from "@/server/services/category.service";
import { getHomeContent } from "@/server/services/home.service";
import { ProductCard } from "@/components/shop/product-card";
import { Hero } from "@/components/shop/hero";
import { CategoryGrid } from "@/components/shop/category-grid";
import { BenefitsMarquee } from "@/components/shop/benefits-marquee";
import { Reveal, Parallax } from "@/components/fx/scroll-fx";
import { Button } from "@/components/ui/button";
import { iconByName } from "@/lib/icon-map";

/** Homepage product rows render a single row of four (two rows on mobile). */
const MAX_ROW_ITEMS = 4;
/** Enough featured items to also fill the hero card fan. */
const HERO_ITEMS = 5;

/** Section heading with the brand accent bar + optional "view all" link. */
function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4 md:mb-9">
      <div className="flex items-center gap-3">
        <span className="h-7 w-1.5 shrink-0 rounded-full bg-primary md:h-9" />
        <h2 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight md:text-4xl">
          {title}
        </h2>
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

/** Centered "shop all …" button that lands on the products/collection page. */
function ShopAllButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-9 flex justify-center">
      <Button asChild size="lg" variant="outline" className="group min-w-56">
        <Link href={href}>
          {label}
          <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
}

export default async function HomePage() {
  const home = await getHomeContent();

  const [featuredAll, bestsellersAll, categories] = await Promise.all([
    home.showFeatured ? getFeaturedProducts(Math.max(MAX_ROW_ITEMS, HERO_ITEMS)) : Promise.resolve([]),
    home.showBestsellers ? getBestsellers(MAX_ROW_ITEMS) : Promise.resolve([]),
    listActiveCategories(home.featuredCategorySlugs),
  ]);

  const featured = featuredAll.slice(0, MAX_ROW_ITEMS);
  const bestsellers = bestsellersAll.slice(0, MAX_ROW_ITEMS);
  const heroContent = home.heroSlides[0];

  return (
    <>
      {/* Hero */}
      <Hero products={featuredAll.slice(0, HERO_ITEMS)} content={heroContent} />

      {/* Scrolling benefits ticker */}
      <BenefitsMarquee />

      {/* Shop by category — RUN-inspired rail, dynamic from DB */}
      {categories.length > 0 && (
        <section className="container-5xl py-12 md:py-16">
          <Reveal>
            <SectionHeading title={home.categorySectionTitle} href="/products" />
          </Reveal>
          <Reveal delay={0.05}>
            <CategoryGrid categories={categories} />
          </Reveal>
        </section>
      )}

      {/* Featured products — one row of four */}
      {featured.length > 0 && (
        <section className="border-y border-border bg-muted/30">
          <div className="container-5xl py-12 md:py-16">
            <Reveal>
              <SectionHeading title="Featured" href="/products" />
            </Reveal>
            <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4" delay={0.05}>
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </Reveal>
            <ShopAllButton href="/products" label="Shop all products" />
          </div>
        </section>
      )}

      {/* Bestsellers — one row of four */}
      {bestsellers.length > 0 && (
        <section className="container-5xl py-12 md:py-16">
          <Reveal>
            <SectionHeading title="Bestsellers" href="/products?sort=rating" />
          </Reveal>
          <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4" delay={0.05}>
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
          <ShopAllButton href="/products?sort=rating" label="Shop all best sellers" />
        </section>
      )}

      {/* CTA */}
      <section className="container-5xl pb-16 pt-4 md:pt-8">
        <Reveal className="relative overflow-hidden rounded-3xl bg-neutral-950 px-6 py-16 text-center text-white md:px-8 md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, oklch(0.86 0.18 96 / 0.22), transparent 65%)",
            }}
          />
          <Parallax className="pointer-events-none absolute -right-6 -top-8 select-none opacity-10" distance={40}>
            <span className="text-[9rem] leading-none">🏋️</span>
          </Parallax>
          <Parallax className="pointer-events-none absolute -bottom-10 -left-4 select-none opacity-10" distance={-30}>
            <span className="text-[7rem] leading-none">💪</span>
          </Parallax>
          <span className="relative inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Join 5XL
          </span>
          <h2 className="relative mt-5 font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
            Ready to level up?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/70">
            Create your free account and unlock rewards, faster checkout and
            subscriber-only pricing.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
              <Link href="/register">Create your account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Trust badges — moved to the bottom */}
      {home.features.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="container-5xl grid grid-cols-2 gap-3 py-10 md:grid-cols-4 md:gap-4 md:py-12">
            {home.features.map((f) => {
              const Icon = iconByName(f.icon);
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-[22px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">{f.title}</p>
                    {f.desc && (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                        {f.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
