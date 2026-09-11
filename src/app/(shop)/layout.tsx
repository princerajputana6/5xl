import { AnnouncementBar } from "@/components/shop/announcement-bar";
import { Navbar } from "@/components/shop/navbar";
import { Footer } from "@/components/shop/footer";
import { MobileBottomNav } from "@/components/shop/mobile-bottom-nav";

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
    </div>
  );
}
