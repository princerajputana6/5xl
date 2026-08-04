import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/server/services/catalog.service";
import { getWishlistProductIds } from "@/server/services/wishlist.service";
import {
  listProductReviews,
  getReviewSummary,
  getUserReview,
} from "@/server/services/review.service";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { ProductCard } from "@/components/shop/product-card";
import { Rating } from "@/components/shop/rating";
import { ReviewsSection } from "@/components/shop/reviews-section";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

  const [related, session, reviews, reviewSummary] = await Promise.all([
    getRelatedProducts(product.slug, product.categorySlug, 4),
    auth(),
    listProductReviews(product.id),
    getReviewSummary(product.id),
  ]);

  const userId = session?.user?.id;
  const [inWishlist, myReview] = await Promise.all([
    userId
      ? getWishlistProductIds(userId).then((ids) => ids.includes(product.id))
      : Promise.resolve(false),
    userId ? getUserReview(userId, product.id) : Promise.resolve(null),
  ]);

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
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

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
          <div className="flex items-center gap-3">
            <Rating value={product.rating} count={product.reviewCount} size="md" />
          </div>
          {product.shortDescription && (
            <p className="text-muted-foreground">{product.shortDescription}</p>
          )}

          <ProductPurchasePanel product={product} initialInWishlist={inWishlist} />

          {product.benefits.length > 0 && (
            <ul className="grid gap-2 pt-2 sm:grid-cols-2">
              {product.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Details tabs */}
      <div className="mt-14">
        <Tabs defaultValue="description">
          <TabsList className="flex-wrap">
            <TabsTrigger value="description">Description</TabsTrigger>
            {product.nutritionFacts.length > 0 && (
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            )}
            {product.ingredients.length > 0 && (
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            )}
            {product.usage && <TabsTrigger value="usage">How to use</TabsTrigger>}
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="max-w-3xl pt-6 leading-relaxed text-muted-foreground">
            {product.description}
          </TabsContent>

          <TabsContent value="nutrition" className="pt-6">
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
          </TabsContent>

          <TabsContent value="ingredients" className="max-w-3xl pt-6">
            <div className="flex flex-wrap gap-2">
              {product.ingredients.map((ing) => (
                <span key={ing} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm">
                  {ing}
                </span>
              ))}
            </div>
          </TabsContent>

          {product.usage && (
            <TabsContent value="usage" className="max-w-3xl pt-6 leading-relaxed text-muted-foreground">
              {product.usage}
            </TabsContent>
          )}

          <TabsContent value="reviews" className="pt-6">
            <ReviewsSection
              slug={product.slug}
              reviews={reviews}
              summary={reviewSummary}
              fallbackRating={product.rating}
              fallbackCount={product.reviewCount}
              canReview={Boolean(userId)}
              myReview={myReview}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
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
