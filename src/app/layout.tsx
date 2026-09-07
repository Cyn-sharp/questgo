import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { HeaderContainer } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuestGo | CIT-U Campus",
  description: "Turn tasks into opportunities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${poppins.className} min-h-screen bg-white text-[#161414] antialiased`}
      >
        <HeaderContainer />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}