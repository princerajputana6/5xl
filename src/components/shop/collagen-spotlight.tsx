import Link from "next/link";
import {
  ArrowRight,
  Bone,
  Droplet,
  FlaskConical,
  Layers,
  Leaf,
  ScanFace,
  Sparkles,
  Star,
} from "lucide-react";
import type { HomeSectionDTO } from "@/server/services/home.service";
import type { ProductCardDTO } from "@/types/catalog";
import { ProductImage } from "@/components/shop/product-image";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { SpotlightAddButton, SpotlightVideo } from "@/components/shop/spotlight-client";
import { discountPct, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * "Product spotlight" homepage section: Marine Collagen hero, feature strip,
 * a three-product stack and a video card. The design is fixed (always light,
 * regardless of site theme); products, links and the video come from admin.
 */

const BENEFITS = [
  { icon: ScanFace, label: "Glowing Skin" },
  { icon: Sparkles, label: "Stronger Hair & Nails" },
  { icon: Bone, label: "Flexible Joints" },
];

const FEATURES = [
  { icon: Layers, label: "Type 1 & 3 Marine Collagen" },
  { icon: Leaf, label: "Easy to Digest" },
  { icon: FlaskConical, label: "No Smell" },
  { icon: Droplet, label: "Pure & High Quality" },
];

const STACK_SIZE = 3;

function StackCard({ product }: { product: ProductCardDTO }) {
  const pct = discountPct(product.mrp, product.price);
  const badge = product.isBestseller ? "Bestseller" : pct > 0 ? `Save ${pct}%` : "";
  const href = `/products/${product.slug}`;
  return (
    <div className="relative flex flex-col rounded-2xl bg-white p-2.5 shadow-[0_6px_24px_-12px_rgba(15,30,60,0.25)] md:p-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f3f6fa]">
        <Link href={href} aria-label={product.name} className="absolute inset-0 block">
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 33vw, 280px"
            className="object-contain p-2"
          />
        </Link>
        {badge && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-[#2f8fdc] px-1 py-0.5 text-[0.5rem] font-bold uppercase tracking-wide text-white md:left-2 md:top-2 md:px-2 md:text-[0.65rem]">
            {badge}
          </span>
        )}
        <div className="absolute right-0.5 top-0.5 text-[#14213d] md:right-1 md:top-1">
          <WishlistButton
            productId={product.id}
            className="size-6 border-transparent bg-white/80 text-[#14213d] hover:bg-white md:size-8 [&_svg]:size-3.5"
          />
        </div>
      </div>
      <Link href={href} className="mt-2.5 block">
        <p className="line-clamp-1 text-[0.8rem] font-bold leading-tight text-[#14213d] md:text-base">
          {product.name}
        </p>
        {product.shortDescription && (
          <p className="mt-1 line-clamp-2 text-[0.65rem] leading-snug text-[#5b6577] md:text-sm">
            {product.shortDescription}
          </p>
        )}
      </Link>
      {product.reviewCount > 0 && (
        <p className="mt-1.5 flex items-center gap-1 whitespace-nowrap text-[0.55rem] text-[#5b6577] md:text-xs">
          <span className="flex text-[#f5a623]">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-2 md:size-3.5",
                  i < Math.round(product.rating) ? "fill-current" : "fill-current opacity-25"
                )}
              />
            ))}
          </span>
          {product.rating.toFixed(1)} ({product.reviewCount})
        </p>
      )}
      <div className="mt-auto flex items-end justify-between gap-1 pt-2">
        <p className="flex flex-col leading-tight sm:flex-row sm:items-baseline sm:gap-1.5">
          <span className="text-sm font-extrabold text-[#14213d] md:text-lg">
            {formatINR(product.price)}
          </span>
          {product.mrp > product.price && (
            <span className="text-[0.6rem] text-[#8a93a3] line-through md:text-xs">
              {formatINR(product.mrp)}
            </span>
          )}
        </p>
        <SpotlightAddButton product={product} />
      </div>
    </div>
  );
}

export function CollagenSpotlight({
  section,
  products,
}: {
  section: HomeSectionDTO;
  products: ProductCardDTO[];
}) {
  const stack = products.slice(0, STACK_SIZE);
  const shopHref = section.ctaHref || "/products";

  return (
    <section className="bg-[#f7f4ef] text-[#14213d]">
      <div className="container-5xl py-6 md:py-12">
        {/* Hero */}
        <div className="relative min-h-[440px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#fbf8f3] via-[#f4f1ec] to-[#dcecf7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/spotlight/collagen-model.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-0 -right-10 h-[86%] w-auto max-w-none object-contain mix-blend-multiply [mask-image:linear-gradient(to_right,transparent_5%,black_45%)] md:right-[10%] md:h-full"
          />
          <div className="relative z-10 max-w-[66%] px-5 py-7 md:max-w-xl md:p-14">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#5b6577] md:text-xs">
              Marine Collagen
            </p>
            <h2 className="mt-2 text-[2rem] font-extrabold leading-[1.02] tracking-tight md:text-7xl">
              Beauty Strength
              <span className="block whitespace-nowrap text-[#2f8fdc]">from Within.</span>
            </h2>
            <p className="mt-3 text-[0.8rem] font-medium leading-snug text-[#3a4558] md:text-lg">
              Supports Healthy Skin, Hair, Nails, Joints &amp; Bones.
            </p>
            <ul className="mt-5 flex gap-2 md:mt-7 md:gap-6">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex w-14 flex-col items-center gap-1.5 text-center md:w-20">
                  <span className="grid size-11 place-items-center rounded-full border border-[#14213d]/15 bg-white md:size-16">
                    <Icon className="size-5 stroke-[1.5] md:size-6" />
                  </span>
                  <span className="text-[0.65rem] font-medium leading-tight md:text-sm">{label}</span>
                </li>
              ))}
            </ul>
            <Link
              href={shopHref}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#14213d] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 md:mt-8 md:px-7 md:py-3"
            >
              Shop Now <ArrowRight className="size-4" />
            </Link>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/spotlight/collagen-tub.png"
            alt="5XL Marine Collagen"
            className="pointer-events-none absolute bottom-4 right-2 z-10 w-[37%] max-w-[300px] drop-shadow-[0_18px_22px_rgba(20,33,61,0.28)] md:bottom-8 md:right-8 md:w-[24%]"
          />
        </div>

        {/* Feature strip */}
        <ul className="mt-4 grid grid-cols-4 divide-x divide-[#14213d]/10 rounded-2xl bg-white px-1 py-3 shadow-[0_6px_24px_-14px_rgba(15,30,60,0.25)] md:mt-6 md:px-4 md:py-5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-1.5 px-1.5 text-center md:flex-row md:gap-3 md:px-5 md:text-left">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef4fa] text-[#2f8fdc] md:size-11">
                <Icon className="size-4 stroke-[1.6] md:size-5" />
              </span>
              <span className="text-[0.6rem] font-semibold leading-tight md:text-sm">{label}</span>
            </li>
          ))}
        </ul>

        {/* Product stack */}
        {stack.length > 0 && (
          <>
            <h3 className="mt-7 text-xl font-extrabold tracking-tight md:mt-12 md:text-3xl">
              {section.title || "Your Beauty Care Stack"}
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-2.5 md:mt-6 md:gap-6">
              {stack.map((p) => (
                <StackCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}

        {/* Video card */}
        {section.videoUrl && (
          <SpotlightVideo
            src={section.videoUrl}
            poster={section.image || undefined}
            eyebrow="Real people. Real results."
            title="Stronger Women Everyday."
          />
        )}
      </div>
    </section>
  );
}
