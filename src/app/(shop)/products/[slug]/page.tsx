import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import {
  getProductBySlug,
  getRelatedProducts,
  getProductOptions,
} from "@/server/services/catalog.service";
import { listPublicOffers } from "@/server/services/coupon.service";
import { getWishlistProductIds } from "@/server/services/wishlist.service";
import {
  listProductReviews,
  getReviewSummary,
  getUserReview,
} from "@/server/services/review.service";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { ProductBuyProvider } from "@/components/shop/product-buy-context";
import { ProductStickyBar } from "@/components/shop/product-sticky-bar";
import { ProductCard } from "@/components/shop/product-card";
import { Rating } from "@/components/shop/rating";
import { ReviewsSection } from "@/components/shop/reviews-section";
import { PriceCard } from "@/components/shop/price-card";
import { OffersStrip } from "@/components/shop/offers-strip";
import { OptionSwatches } from "@/components/shop/option-swatches";
import { PincodeChecker } from "@/components/shop/pincode-checker";
import { KeyBenefits } from "@/components/shop/key-benefits";
import { FrequentlyBoughtTogether } from "@/components/shop/frequently-bought-together";
import { AboutProduct } from "@/components/shop/about-product";
import { ProductFaqs } from "@/components/shop/product-faqs";
import { getProductFaqs } from "@/lib/product-faq";
import { getKeyBenefits, getUsage, getServingInfo } from "@/lib/product-content";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description?.slice(0, 155),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, session, reviews, reviewSummary, options, offers] = await Promise.all([
    getRelatedProducts(product.slug, product.categorySlug, 6),
    auth(),
    listProductReviews(product.id),
    getReviewSummary(product.id),
    getProductOptions(product.name, product.slug),
    listPublicOffers(),
  ]);

  const userId = session?.user?.id;
  const [inWishlist, myReview] = await Promise.all([
    userId
      ? getWishlistProductIds(userId).then((ids) => ids.includes(product.id))
      : Promise.resolve(false),
    userId ? getUserReview(userId, product.id) : Promise.resolve(null),
  ]);

  const servingInfo = getServingInfo(product.name, product.categorySlug);

  return (
    <div className="container-5xl py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {product.categorySlug && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/products?category=${product.categorySlug}`} className="hover:text-foreground">
              {product.categoryName}
            </Link>
          </>
        )}
      </nav>

      {/* Main */}
      <ProductBuyProvider product={product}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          name={product.name}
          productId={product.id}
          initialInWishlist={inWishlist}
        />

        <div className="space-y-5">
          {product.brandName && (
            <Link
              href={product.brandSlug ? `/brands/${product.brandSlug}` : "#"}
              className="text-sm font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              {product.brandName}
            </Link>
          )}

          <h1 className="font-display text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
            {product.name}
          </h1>

          {servingInfo && (
            <p className="inline-block rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-medium">
              {servingInfo}
            </p>
          )}

          <Rating value={product.rating} count={product.reviewCount} size="md" />

          <PriceCard price={product.price} mrp={product.mrp} />

          <p className={cn("text-sm font-medium", product.inStock ? "text-success" : "text-destructive")}>
            {product.inStock ? "✓ In stock — ready to ship" : "Out of stock"}
          </p>

          <OffersStrip offers={offers} />

          <OptionSwatches
            label="Flavour"
            current={options.currentFlavour}
            options={options.flavours}
            variant="flavour"
          />
          <OptionSwatches
            label="Size"
            current={options.currentSize}
            options={options.sizes}
            variant="size"
          />

          <ProductPurchasePanel product={product} />
          <div id="buy-anchor" aria-hidden className="h-px" />

          <PincodeChecker />
        </div>
      </div>
      <ProductStickyBar product={product} />
      </ProductBuyProvider>

      <KeyBenefits benefits={getKeyBenefits(product.categorySlug)} />

      <FrequentlyBoughtTogether product={product} suggestions={related} />

      <AboutProduct
        description={product.description}
        benefits={product.benefits}
        usage={getUsage(product.usage, product.categorySlug)}
      />

      {/* Nutrition facts */}
      {product.nutritionFacts.length > 0 && (
        <section className="mt-8 md:mt-10">
          <h2 className="mb-4 font-display text-2xl font-extrabold uppercase tracking-tight">
            Nutrition Facts
          </h2>
          <div className="max-w-md overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody>
                {product.nutritionFacts.map((n, i) => (
                  <tr key={n.label} className={i % 2 ? "bg-muted/40" : ""}>
                    <td className="px-4 py-2.5 font-medium">{n.label}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{n.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Ingredients */}
      {product.ingredients.length > 0 && (
        <section className="mt-8 max-w-3xl md:mt-10">
          <h2 className="mb-4 font-display text-2xl font-extrabold uppercase tracking-tight">
            Ingredients
          </h2>
          <div className="flex flex-wrap gap-2">
            {product.ingredients.map((ing) => (
              <span key={ing} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm">
                {ing}
              </span>
            ))}
          </div>
        </section>
      )}

      <ProductFaqs faqs={getProductFaqs(product.categorySlug)} />

      {/* Ratings & Reviews */}
      <section className="mt-10 md:mt-14">
        <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight">
          Ratings &amp; Reviews
        </h2>
        <ReviewsSection
          slug={product.slug}
          reviews={reviews}
          summary={reviewSummary}
          fallbackRating={product.rating}
          fallbackCount={product.reviewCount}
          canReview={Boolean(userId)}
          myReview={myReview}
        />
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-10 md:mt-14">
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight">
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
