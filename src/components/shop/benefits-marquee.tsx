import { Star } from "lucide-react";

/**
 * Seamless scrolling ticker of brand promises. The list is rendered twice so
 * the -50% keyframe loops without a seam. Purely decorative.
 */
const ITEMS = [
  "100% Lab-Tested",
  "Authentic Guaranteed",
  "Free Shipping over ₹999",
  "24h Dispatch",
  "50,000+ Athletes Fueled",
  "No Added Sugar",
  "FSSAI Certified",
  "Made for Serious Lifters",
];

export function BenefitsMarquee() {
  const track = [...ITEMS, ...ITEMS];
  return (
    <div className="relative flex overflow-hidden border-y border-border bg-neutral-950 py-3 text-white">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-neutral-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-neutral-950 to-transparent" />
      <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
        {track.map((t, i) => (
          <span key={i} className="flex shrink-0 items-center gap-3">
            <span className="font-display text-sm font-bold uppercase tracking-wide">{t}</span>
            <Star className="size-3.5 fill-primary text-primary" />
          </span>
        ))}
      </div>
    </div>
  );
}
