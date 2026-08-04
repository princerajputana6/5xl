import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/lib/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-neutral-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, oklch(0.86 0.18 96 / 0.45), transparent 60%), radial-gradient(50% 60% at 90% 90%, oklch(0.86 0.18 96 / 0.22), transparent 60%)",
          }}
        />
        <div className="relative">
          <Logo className="text-white [&_span:first-child]:text-white" />
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-4xl font-extrabold uppercase leading-[0.95] text-white">
            Fuel beyond
            <span className="text-primary"> limits.</span>
          </p>
          <p className="mt-4 text-sm text-neutral-400">
            Lab-tested sports nutrition trusted by serious athletes across
            India. Join {siteConfig.name} and train without compromise.
          </p>
        </div>
        <p className="relative text-xs text-neutral-500">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-6 lg:hidden">
          <Logo />
          <Link href="/" className="text-sm text-muted-foreground">
            ← Store
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  );
}
