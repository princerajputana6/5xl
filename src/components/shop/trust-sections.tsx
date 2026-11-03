import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { Reveal } from "@/components/fx/scroll-fx";
import { VideoSlider, type VideoSlide } from "@/components/shop/video-slider";
import { InstagramIcon, FacebookIcon, XIcon } from "@/components/shop/social-icons";
import { cn } from "@/lib/utils";

/* Static homepage trust blocks: marketplaces, "seen & trusted" clips, socials. */

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 md:mb-8">
      <span className="mt-1 h-7 w-1.5 shrink-0 rounded-full bg-primary md:h-9" />
      <div>
        <h2 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight md:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function AmazonLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 48" role="img" aria-label="Amazon" className={className}>
      <text
        x="80"
        y="28"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="32"
        letterSpacing="-1"
        fill="#131921"
      >
        amazon
      </text>
      <path d="M38 34 Q80 48 118 34" fill="none" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" />
      <path d="M110 30 L120 33 L114 41" fill="none" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlipkartLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 48" role="img" aria-label="Flipkart" className={className}>
      <rect x="4" y="6" width="36" height="36" rx="8" fill="#2874F0" />
      <path d="M15 34 V15 H30 M15 24 H27" fill="none" stroke="#FFE500" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <text
        x="48"
        y="33"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fontSize="28"
        fill="#2874F0"
      >
        Flipkart
      </text>
    </svg>
  );
}

const MARKETPLACES = [
  { name: "Amazon", Logo: AmazonLogo },
  { name: "Flipkart", Logo: FlipkartLogo },
];

/** "Featured & Trusted" — marketplaces 5XL sells on. */
export function FeaturedTrusted() {
  return (
    <section className="container-5xl py-8 md:py-12">
      <Reveal>
        <Heading title="Featured & Trusted" subtitle="Also available on India’s biggest marketplaces." />
      </Reveal>
      <Reveal delay={0.05} className="grid grid-cols-2 gap-3 md:gap-5">
        {MARKETPLACES.map(({ name, Logo }) => (
          <div
            key={name}
            className="grid h-24 place-items-center rounded-2xl border border-border bg-white px-6 md:h-32"
          >
            <Logo className="h-9 w-auto md:h-12" />
          </div>
        ))}
      </Reveal>
    </section>
  );
}

const SEEN_VIDEOS: VideoSlide[] = [
  { url: "/videos/collagen-story.mp4", poster: "", caption: "", product: null },
  { url: "/videos/hero-gym.mp4", poster: "/videos/hero-poster.jpg", caption: "", product: null },
  { url: "/videos/collagen-story.mp4", poster: "", caption: "", product: null },
];

/** "Seen & Trusted By" — three static clips. */
export function SeenTrusted() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="container-5xl py-8 md:py-12">
        <Reveal>
          <Heading title="Seen & Trusted By" subtitle="As seen" />
        </Reveal>
        <Reveal delay={0.05}>
          <VideoSlider slides={SEEN_VIDEOS} mobileColumns={1.5} />
        </Reveal>
      </div>
    </section>
  );
}

const SOCIALS = [
  {
    name: "Instagram",
    href: siteConfig.social.instagram,
    Icon: InstagramIcon,
    tile: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
  },
  { name: "X (Twitter)", href: siteConfig.social.x, Icon: XIcon, tile: "bg-black" },
  { name: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon, tile: "bg-[#1877F2]" },
];

/** "Our Socials" — replaces the footer's social icon row. */
export function SocialsSection() {
  return (
    <section className="container-5xl py-8 md:py-12">
      <Reveal>
        <Heading title="Our Socials" subtitle="Follow 5XL for drops, training tips and real results." />
      </Reveal>
      <Reveal delay={0.05} className="grid grid-cols-3 gap-2.5 md:gap-5">
        {SOCIALS.map(({ name, href, Icon, tile }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 text-center transition-all sm:flex-row sm:gap-4 sm:p-4 sm:text-left duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md md:p-5"
          >
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl text-white md:size-14", tile)}>
              <Icon className="size-6 md:size-7" />
            </span>
            <span className="min-w-0 sm:flex-1">
              <span className="block text-xs font-bold sm:text-base">{name}</span>
              <span className="hidden truncate text-sm text-muted-foreground sm:block">@5xl</span>
            </span>
            <ArrowUpRight className="hidden size-5 text-muted-foreground sm:block transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </a>
        ))}
      </Reveal>
    </section>
  );
}
