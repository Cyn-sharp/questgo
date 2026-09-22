import Navbar from "@/components/layout/Navbar";
import { DashboardBottomNav } from "@/components/layout/DashboardBottomNav";

export default function MessengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Top Navbar (Desktop only) */}
      <Navbar /> 
      
      {/* Main Content Area */}
      <main className="flex-grow pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom Tabbar (Mobile only) */}
      <DashboardBottomNav />
    </div>
  );
}