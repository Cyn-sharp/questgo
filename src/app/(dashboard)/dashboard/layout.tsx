import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/auth/firebase-admin";
import Navbar from "@/components/layout/Navbar";
import { DashboardBottomNav } from "@/components/layout/DashboardBottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await cookies()).get("questgo_session")?.value;

  if (!session) redirect("/login");

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (!decoded.email_verified) redirect("/login");
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <main className="flex-grow pb-24 md:pb-8">{children}</main>
      <DashboardBottomNav />
    </div>
  );
}