import Link from "next/link";
import { getFeaturedProducts, getBestsellers } from "@/server/services/catalog.service";
import { listActiveCategories } from "@/server/services/category.service";
import { getHomeContent } from "@/server/services/home.service";
import { ProductCard } from "@/components/shop/product-card";
import { Hero } from "@/components/shop/hero";
import { CategoryGrid } from "@/components/shop/category-grid";
import { Reveal, Parallax } from "@/components/fx/scroll-fx";
import { Button } from "@/components/ui/button";
import { iconByName } from "@/lib/icon-map";

export default async function HomePage() {
  const home = await getHomeContent();

  const [featured, bestsellers, categories] = await Promise.all([
    home.showFeatured ? getFeaturedProducts(8) : Promise.resolve([]),
    home.showBestsellers ? getBestsellers(4) : Promise.resolve([]),
    listActiveCategories(home.featuredCategorySlugs),
  ]);

  const heroContent = home.heroSlides[0];

  return (
    <>
      {/* Hero */}
      <Hero products={featured.slice(0, 5)} content={heroContent} />

      {/* Feature strip */}
      {home.features.length > 0 && (
        <section className="relative z-10 border-b border-border bg-background">
          <div className="container-5xl grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
            {home.features.map((f) => {
              const Icon = iconByName(f.icon);
              return (
                <div key={f.title} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-6 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    {f.desc && <p className="text-sm text-muted-foreground">{f.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Shop by category — square tiles, dynamic from DB */}
      {categories.length > 0 && (
        <section className="container-5xl py-14 md:py-16">
          <Reveal className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
              {home.categorySectionTitle}
            </h2>
            <Link
              href="/products"
              className="text-sm font-semibold text-foreground/70 hover:text-foreground hover:underline"
            >
              View all
            </Link>
          </Reveal>
          <Reveal delay={0.05}>
            <CategoryGrid categories={categories} />
          </Reveal>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container-5xl py-14 md:py-16">
          <Reveal className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
              Featured
            </h2>
            <Link href="/products" className="text-sm font-semibold text-foreground/70 hover:text-foreground hover:underline">
              View all
            </Link>
          </Reveal>
          <Reveal className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" delay={0.05}>
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Reveal>
        </section>
      )}

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="border-y border-border bg-muted/30">
          <div className="container-5xl py-14 md:py-16">
            <Reveal className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
                Bestsellers
              </h2>
              <Link href="/products?sort=rating" className="text-sm font-semibold text-foreground/70 hover:text-foreground hover:underline">
                View all
              </Link>
            </Reveal>
            <Reveal className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" delay={0.05}>
              {bestsellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-5xl py-20">
        <Reveal className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <Parallax
            className="pointer-events-none absolute -right-6 -top-8 select-none opacity-15"
            distance={40}
          >
            <span className="text-[9rem] leading-none">🏋️</span>
          </Parallax>
          <Parallax
            className="pointer-events-none absolute -bottom-10 -left-4 select-none opacity-15"
            distance={-30}
          >
            <span className="text-[7rem] leading-none">💪</span>
          </Parallax>
          <h2 className="relative font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
            Ready to level up?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-primary-foreground/80">
            Create your free account and unlock rewards, faster checkout and
            subscriber-only pricing.
          </p>
          <Button
            asChild
            size="lg"
            className="relative mt-6 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Link href="/register">Create your account</Link>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
