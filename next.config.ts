import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image optimization (sharp) is unavailable on Cloudflare Workers.
    // All product/hero images are already served from external CDNs, so skip
    // the optimizer. Swap to a Cloudflare Images loader later if desired.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;

// Expose Cloudflare bindings (env, KV, R2, ...) to `next dev` via OpenNext.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
