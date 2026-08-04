import Link from "next/link";
import { Camera, Play, AtSign } from "lucide-react";
import { footerNav, siteConfig } from "@/lib/site";
import { Logo } from "@/components/shared/logo";
import { Newsletter } from "./newsletter";

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
              <Camera className="size-5" />
            </a>
            <a href={siteConfig.social.youtube} aria-label="YouTube" className="hover:text-foreground">
              <Play className="size-5" />
            </a>
            <a href={siteConfig.social.twitter} aria-label="Twitter" className="hover:text-foreground">
              <AtSign className="size-5" />
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
