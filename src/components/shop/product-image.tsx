"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { fallbackProductImage } from "@/lib/product-fallback-image";

type ProductImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
  /** Distinguishes fallback photos for multiple images of the same product (e.g. gallery thumbnails). */
  fallbackSeed?: string;
};

/**
 * Product photo with an automatic fallback — some catalog entries point at
 * image paths that 404 (bad imports, missing uploads), so this swaps to a
 * relevant stock photo (picked from the product name) instead of a broken
 * image icon.
 */
export function ProductImage({ src, alt, fallbackSeed, ...props }: ProductImageProps) {
  const seed = fallbackSeed ?? (typeof alt === "string" ? alt : "");
  const fallback = fallbackProductImage(seed);

  const [resolvedSrc, setResolvedSrc] = React.useState(src || fallback);
  const [lastSrc, setLastSrc] = React.useState(src);
  if (src !== lastSrc) {
    setLastSrc(src);
    setResolvedSrc(src || fallback);
  }

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      onError={() => setResolvedSrc(fallback)}
    />
  );
}
