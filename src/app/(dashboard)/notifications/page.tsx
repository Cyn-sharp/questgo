"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { SubPage, Panel } from "@/components/profile/SubPage";
import { Button } from "@/components/ui/Button";
import { useQuestNotifications } from "@/components/quest/QuestNotifications";

export default function NotificationsPage() {
  const { unreadCount, openChat } = useQuestNotifications();
  return (
    <SubPage title="Notifications" description="Message and quest alerts appear in the app while you're signed in.">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-maroon" aria-hidden />
            <div>
              <p className="font-bold">{unreadCount ? `${unreadCount} unread conversation${unreadCount === 1 ? "" : "s"}` : "You're all caught up"}</p>
              <p className="text-sm text-stone-600">Quest status changes show as a notice at the top of the screen.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => openChat(null)}>Open inbox</Button>
        </div>
      </Panel>
      <Panel title="Good to know">
        <p className="text-sm text-stone-600">Alerts only arrive while QuestGo is open. Background push notifications aren&apos;t available yet. Check <Link href="/requests" className="font-semibold text-maroon underline">My Requests</Link> for the latest on your quests.</p>
      </Panel>
    </SubPage>
  );
}
