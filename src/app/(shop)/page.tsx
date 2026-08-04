import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, BadgeCheck, FlaskConical } from "lucide-react";
import { mockCategories, mockGoals, mockFeatures } from "@/lib/mock";
import { getFeaturedProducts, getBestsellers } from "@/server/services/catalog.service";
import { ProductCard } from "@/components/shop/product-card";
import { HeroShowcase } from "@/components/shop/hero-showcase";
import { Button } from "@/components/ui/button";

const featureIcons = [FlaskConical, Truck, ShieldCheck, BadgeCheck];

export default async function HomePage() {
  const [featured, bestsellers] = await Promise.all([
    getFeaturedProducts(8),
    getBestsellers(4),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 60% at 12% 0%, oklch(0.86 0.18 96 / 0.40), transparent 55%), radial-gradient(45% 60% at 92% 100%, oklch(0.86 0.18 96 / 0.20), transparent 55%)",
          }}
        />
        <div className="container-5xl relative grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground">
              <span className="size-1.5 rounded-full bg-primary" /> Premium Sports Nutrition
            </span>
            <h1 className="max-w-3xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
              Fuel beyond{" "}
              <span className="inline-block -skew-x-6 bg-primary px-3 text-primary-foreground">
                limits
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Lab-tested whey, creatine and mass gainers engineered for serious
              athletes. Authentic supplements, delivered fast across India.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/products">
                  Shop all products <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/subscriptions">Start a subscription</Link>
              </Button>
            </div>
          </div>

          <HeroShowcase />
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-b border-border">
        <div className="container-5xl grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {mockFeatures.map((f, i) => {
            const Icon = featureIcons[i];
            return (
              <div key={f.title} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-6 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Shop by category */}
      <section className="container-5xl py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
            Shop by category
          </h2>
          <Link href="/products" className="text-sm font-semibold text-foreground/70 hover:text-foreground hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {mockCategories.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="group rounded-xl border border-border bg-card p-5 text-center transition-colors hover:border-primary"
            >
              <div className="text-4xl transition-transform group-hover:scale-110">
                {c.emoji}
              </div>
              <p className="mt-3 font-display font-semibold uppercase leading-tight">
                {c.name}
              </p>
              <p className="text-xs text-muted-foreground">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container-5xl py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
              Featured
            </h2>
            <Link href="/products" className="text-sm font-semibold text-foreground/70 hover:text-foreground hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="border-y border-border bg-muted/30">
          <div className="container-5xl py-16">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
                Bestsellers
              </h2>
              <Link href="/products?sort=rating" className="text-sm font-semibold text-foreground/70 hover:text-foreground hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {bestsellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop by goal */}
      <section className="bg-muted/30">
        <div className="container-5xl py-16">
          <h2 className="mb-8 font-display text-3xl font-extrabold uppercase tracking-tight">
            Shop by goal
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mockGoals.map((g) => (
              <Link
                key={g.slug}
                href={`/products?goal=${g.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <div>
                  <h3 className="font-display text-xl font-bold uppercase">{g.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{g.desc}</p>
                </div>
                <span className="mt-6 inline-flex items-center text-sm font-semibold text-foreground">
                  Explore <ArrowRight className="ml-1 size-4 text-primary transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-5xl py-20">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
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
        </div>
      </section>
    </>
  );
}
