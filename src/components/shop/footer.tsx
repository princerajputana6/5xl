import Link from "next/link";
import { footerNav, siteConfig } from "@/lib/site";
import { Logo } from "@/components/shared/logo";
import { Newsletter } from "./newsletter";

/* Brand marks as inline SVGs (this lucide build ships no brand icons). */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M14 8.5V7c0-.8.5-1 1-1h2V3h-3c-2.2 0-4 1.8-4 4v1.5H8V12h2v9h3v-9h2.3l.7-3.5H13Z" />
    </svg>
  );
}

/** X (formerly Twitter) logo. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

const columns: { title: string; links: readonly { label: string; href: string }[] }[] = [
  { title: "Shop", links: footerNav.shop },
  { title: "Support", links: footerNav.support },
  { title: "Company", links: footerNav.company },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      {/* Newsletter strip */}
      <div className="border-b border-border">
        <div className="container-5xl flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight">
              Join the 5XL squad
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Early access to drops, training tips and subscriber-only offers.
            </p>
          </div>
          <Newsletter />
        </div>
      </div>

      {/* Link columns */}
      <div className="container-5xl grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
          <div className="mt-4 flex gap-3 text-muted-foreground">
            <a href={siteConfig.social.instagram} aria-label="Instagram" className="hover:text-foreground">
              <InstagramIcon className="size-5" />
            </a>
            <a href={siteConfig.social.facebook} aria-label="Facebook" className="hover:text-foreground">
              <FacebookIcon className="size-5" />
            </a>
            <a href={siteConfig.social.x} aria-label="X" className="hover:text-foreground">
              <XIcon className="size-[18px]" />
            </a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container-5xl flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name} Nutrition. All rights
            reserved.
          </p>
          <p>Made in India 🇮🇳 · Fuel Beyond Limits</p>
        </div>
      </div>
    </footer>
  );
}
