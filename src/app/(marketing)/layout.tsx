import { HeaderContainer } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderContainer />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}