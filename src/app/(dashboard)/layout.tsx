import { redirect } from "next/navigation";
import { currentIdCheck, currentSession } from "@/lib/auth/id-check-server";
import { QuestNotifications } from "@/components/quest/QuestNotifications";
import { AppShell } from "@/components/layout/AppShell";
import { IdCheckBanner } from "@/components/auth/IdCheckBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/login");

  // Everyone can look around. Students whose CIT-U ID isn't approved yet see a
  // banner saying that posting and accepting quests unlock after approval.
  // If the check can't be read right now, the app still opens: the server
  // checks the ID again whenever someone posts or accepts a quest.
  const idCheck = await currentIdCheck().catch(() => null);

  return (
    <QuestNotifications>
      <AppShell>
        {idCheck && !idCheck.canPostAndAccept ? (
          <IdCheckBanner uid={session.uid} state={idCheck.state} reason={idCheck.reason} />
        ) : null}
        {children}
      </AppShell>
    </QuestNotifications>
  );
}