import { AnnouncementBar } from "@/components/shop/announcement-bar";
import { Navbar } from "@/components/shop/navbar";
import { Footer } from "@/components/shop/footer";
import { MobileBottomNav } from "@/components/shop/mobile-bottom-nav";
import { CookieConsent } from "@/components/shop/cookie-consent";

// The storefront reads live CMS/catalogue data from D1 (a per-request binding),
// so it renders dynamically rather than being prerendered at build.
export const dynamic = "force-dynamic";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar />
      <Navbar />
      {/* Extra bottom padding on mobile so content clears the fixed bottom nav */}
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <CookieConsent />
    </div>
  );
}
