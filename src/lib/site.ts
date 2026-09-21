export const siteConfig = {
  name: "5XL",
  tagline: "Fuel Beyond Limits",
  description:
    "Premium sports nutrition, engineered for serious athletes. Lab-tested whey, creatine, mass gainers and more — authentic, fast-shipped across India.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: "5xlnutrition@gmail.com",
  supportPhone: "+91 92895 37733",
  /** Google Tag Manager container id (overridable via env). */
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MVPTZ5VQ",
  social: {
    instagram: "https://instagram.com/5xl",
    youtube: "https://youtube.com/@5xl",
    twitter: "https://twitter.com/5xl",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

/** Primary storefront navigation (placeholder data for M1). */
export const mainNav: NavItem[] = [
  { label: "Shop All", href: "/products" },
  { label: "Protein", href: "/products?category=performance-protein" },
  { label: "Creatine", href: "/products?category=creatine" },
  { label: "Mass Gainer", href: "/products?category=mass-gainer" },
  { label: "Pre-Workout", href: "/products?category=pre-workout" },
  { label: "Offers", href: "/offers" },
  { label: "Blog", href: "/blog" },
];

export const shopByGoal: NavItem[] = [
  { label: "Build Muscle", href: "/products?goal=muscle" },
  { label: "Lose Fat", href: "/products?goal=fat-loss" },
  { label: "Boost Performance", href: "/products?goal=performance" },
  { label: "Everyday Health", href: "/products?goal=wellness" },
];

export const footerNav = {
  shop: [
    { label: "All Products", href: "/products" },
    { label: "Brands", href: "/brands" },
    { label: "Offers", href: "/offers" },
    { label: "Blog", href: "/blog" },
  ],
  support: [
    { label: "Track Order", href: "/track-order" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Shipping Policy", href: "/shipping-policy" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
} as const;
