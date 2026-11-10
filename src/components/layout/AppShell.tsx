import Navbar from "@/components/layout/Navbar";
import { DashboardBottomNav } from "@/components/layout/DashboardBottomNav";

// Template: the signed-in app frame. Header on top, page content, and the
// bottom tab bar on phones (the header carries the links from tablet width up).
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Navbar />
      <main className="flex-grow pb-28 md:pb-10">{children}</main>
      <DashboardBottomNav />
    </div>
  );
}
