/** JSON-safe DTOs passed from server to client components. */

export type VariantDTO = {
  id: string;
  label: string;
  flavour?: string;
  size?: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
};

export type ProductCardDTO = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  brandName: string | null;
  categorySlug: string | null;
  shortDescription?: string;
  isBestseller: boolean;
  inStock: boolean;
};

export type ProductDetailDTO = ProductCardDTO & {
  sku: string;
  description?: string;
  images: string[];
  gstPct: number;
  variants: VariantDTO[];
  nutritionFacts: { label: string; value: string }[];
  ingredients: string[];
  benefits: string[];
  keyBenefits: { title: string; description: string; images: string[] }[];
  usage?: string;
  tags: string[];
  goals: string[];
  brandSlug: string | null;
  categoryName: string | null;
};

export type FacetDTO = {
  categories: { name: string; slug: string; emoji?: string; count?: number }[];
  brands: { name: string; slug: string }[];
  priceRange: { min: number; max: number };
};

export type ListResult = {
  items: ProductCardDTO[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
};

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
