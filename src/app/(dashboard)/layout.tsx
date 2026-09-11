import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/auth/firebase-admin";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = (await cookies()).get("questgo_session")?.value;

  if (!session) redirect("/login");

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (!decoded.email_verified) redirect("/login");
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}