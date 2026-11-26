"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Activity, Bell, BellOff, ChevronRight, Settings, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAlertHistory } from "@/lib/notifications/history-store";
import { timeAgo, unreadAlerts, type AlertRecord } from "@/lib/notifications/history";
import { UnreadBadge } from "@/components/ui/UnreadBadge";

const KIND = {
  questUpdate: { icon: Activity, bg: "bg-[#fdf0f2]", color: "text-[#7a1f32]" },
  newQuest: { icon: Sparkles, bg: "bg-[#f6ecc8]", color: "text-[#b08b1e]" },
} as const;

export function NotificationBell() {
  const { user } = useAuth();
  return user ? <BellMenu key={user.uid} uid={user.uid} /> : null;
}

function BellMenu({ uid }: { uid: string }) {
  const { alerts, readAll, clear } = useAlertHistory(uid);
  const [open, setOpen] = useState(false);
  // Opening the bell clears its count, but what was new stays highlighted until it closes.
  const [highlight, setHighlight] = useState<ReadonlySet<string>>(new Set());
  const [now, setNow] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const unread = unreadAlerts(alerts);

  function show() {
    setHighlight(new Set(alerts.filter((item) => !item.read).map((item) => item.id)));
    setNow(Date.now());
    setOpen(true);
    readAll();
  }

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? setOpen(false) : show())}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${open ? "bg-white/10 text-white ring-white/25" : "text-white/85 ring-white/10 hover:bg-white/[0.06] hover:text-white"}`}
      >
        <Bell className={`h-[18px] w-[18px] ${unread ? "origin-top animate-[bell-ring_1.2s_ease-in-out_1]" : ""}`} />
        <UnreadBadge count={unread} className="absolute -right-1 -top-1 ring-[#161414]" />
      </button>

      {open && (
        <section
          id={panelId}
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(23rem,calc(100vw-2rem))] origin-top-right animate-[bell-panel_160ms_ease-out] overflow-hidden rounded-2xl border border-white/40 bg-white text-[#161414] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[#f0ece6] px-4 py-3">
            <div>
              <h2 className="text-sm font-extrabold">Notifications</h2>
              <p className="text-[11px] text-[#4a4340]">Quest updates from the last 3 days</p>
            </div>
            {alerts.length > 0 && (
              <button type="button" onClick={clear} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#7a1f32] transition hover:bg-[#fbf8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227]">
                Clear all
              </button>
            )}
          </header>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-9 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f2ef]"><BellOff className="h-5 w-5 text-[#4a4340]" /></div>
              <p className="mt-3 text-sm font-bold">You&apos;re all caught up</p>
              <p className="mt-1 text-xs text-[#4a4340]">Quest updates and new quests will show up here. Chats are under Messages.</p>
            </div>
          ) : (
            <ul className="max-h-[min(24rem,60vh)] divide-y divide-[#f0ece6] overflow-y-auto">
              {alerts.map((item) => <AlertRow key={item.id + item.at} item={item} isNew={highlight.has(item.id)} now={now} onOpen={() => setOpen(false)} />)}
            </ul>
          )}

          <Link href="/notifications" onClick={() => setOpen(false)}
            className="group flex items-center gap-2 border-t border-[#f0ece6] bg-[#fbf8f0] px-4 py-3 text-sm font-semibold text-[#4a4340] transition hover:text-[#7a1f32]">
            <Settings className="h-4 w-4" /> Notification settings
            <ChevronRight className="ml-auto h-4 w-4 text-[#d8d3cc] transition group-hover:translate-x-0.5 group-hover:text-[#7a1f32]" />
          </Link>
        </section>
      )}
    </div>
  );
}

function AlertRow({ item, isNew, now, onOpen }: { item: AlertRecord; isNew: boolean; now: number; onOpen: () => void }) {
  const kind = KIND[item.kind];
  const Icon = kind.icon;
  return (
    <li>
      <Link href={item.href} onClick={onOpen} className={`flex items-start gap-3 px-4 py-3 transition hover:bg-[#fbf8f0] ${isNew ? "bg-[#fffaf0]" : ""}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${kind.bg}`}><Icon aria-hidden="true" className={`h-4 w-4 ${kind.color}`} /></div>
        <div className="min-w-0 flex-1">
          <p className={`break-words text-sm ${isNew ? "font-bold" : "font-medium text-[#4a4340]"}`}>{item.text}</p>
          <p className="mt-0.5 text-[11px] text-[#4a4340]/80">{timeAgo(item.at, now)}</p>
        </div>
        {isNew && <span aria-label="New" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#7a1f32]" />}
      </Link>
    </li>
  );
}
