import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth/id-check-server";
import { QuestNotifications } from "@/components/quest/QuestNotifications";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/login");

  // Everyone can look around. The server checks the CIT-U ID again whenever someone posts or accepts a quest.
  return (
    <QuestNotifications>
      <AppShell>
        {children}
      </AppShell>
    </QuestNotifications>
  );
}