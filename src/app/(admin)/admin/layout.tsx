import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/auth/firebase-admin";
import { currentSession } from "@/lib/auth/id-check-server";
import { AdminShell } from "@/components/admin/AdminShell";

// Every admin page passes through this check first, on the server, before anything is shown.
// Not logged in -> login page. Logged in but not an admin -> back to their Home page.
// So students never see any part of the admin console.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/login");

  // Asked fresh from Firebase whenever the console is opened, so removing the admin role
  // or suspending the account takes effect right away (not when the login expires).
  const account = await adminAuth.getUser(session.uid).catch(() => null);
  if (!account || account.disabled || account.customClaims?.admin !== true) redirect("/dashboard");

  return (
    <AdminShell name={account.displayName?.trim() || "Administrator"} email={account.email ?? ""}>
      {children}
    </AdminShell>
  );
}