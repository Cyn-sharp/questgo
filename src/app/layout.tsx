import type { Metadata } from "next";
import { HeaderContainer } from "@/components/layout/Navbar";
import "./globals.css";

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
      <body className="min-h-screen bg-white font-sans antialiased">
        <HeaderContainer />
        <main>{children}</main>
      </body>
    </html>
  );
}