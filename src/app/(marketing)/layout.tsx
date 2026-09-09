import { HeaderContainer } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderContainer />
      <main>{children}</main>
      <Footer />
    </>
  );
}