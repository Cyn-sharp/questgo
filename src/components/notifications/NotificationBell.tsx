"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Bell, BellOff, ChevronRight, Settings, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAlertHistory } from "@/lib/notifications/history-store";
import { timeAgo, unreadAlerts, type AlertRecord } from "@/lib/notifications/history";
import { UnreadBadge } from "@/components/ui/UnreadBadge";

// Dark glass panel that drops out of the header, in the header's own colours.
const KIND = {
  questUpdate: { icon: Activity, tile: "bg-maroon/25 ring-1 ring-maroon-light/40", color: "text-[#f3b7c3]" },
  newQuest: { icon: Sparkles, tile: "bg-gold/15 ring-1 ring-gold/30", color: "text-gold" },
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
      <motion.button
        ref={button}
        type="button"
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? setOpen(false) : show())}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full ring-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${open ? "bg-gold/15 text-gold ring-gold/40" : "text-white/85 ring-white/10 hover:bg-white/[0.06] hover:text-gold"}`}
      >
        <Bell className={`h-[18px] w-[18px] ${unread ? "origin-top animate-[bell-ring_1.2s_ease-in-out_1]" : ""}`} />
        <UnreadBadge count={unread} className="absolute -right-1 -top-1 ring-[#161414]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            id={panelId}
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(23rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#161414]/95 text-white shadow-[0_24px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(201,162,39,0.06)] backdrop-blur-xl"
          >
            {/* Gold hairline, like the bottom bar's specular edge */}
            <div aria-hidden className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-maroon/30 blur-3xl" />

            <header className="relative flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5">
              <div>
                <h2 className="font-display text-[15px] font-bold tracking-wide">Notifications</h2>
                <p className="text-[11px] text-white/50">Quest updates from the last 3 days</p>
              </div>
              {alerts.length > 0 && (
                <button type="button" onClick={clear} className="rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold/90 transition hover:bg-white/[0.06] hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                  Clear all
                </button>
              )}
            </header>

            {alerts.length === 0 ? (
              <div className="relative flex flex-col items-center px-6 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10"><BellOff className="h-5 w-5 text-white/60" /></div>
                <p className="mt-3 font-display text-sm font-bold">You&apos;re all caught up</p>
                <p className="mt-1 max-w-[16rem] text-xs text-white/50">Quest updates and new quests will show up here. Chats are under Messages.</p>
              </div>
            ) : (
              <ul className="relative max-h-[min(24rem,60vh)] divide-y divide-white/[0.06] overflow-y-auto overscroll-contain">
                {alerts.map((item, index) => (
                  <AlertRow key={item.id + item.at} item={item} index={index} isNew={highlight.has(item.id)} now={now} onOpen={() => setOpen(false)} />
                ))}
              </ul>
            )}

            <Link href="/notifications" onClick={() => setOpen(false)}
              className="group relative flex items-center gap-2 border-t border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/[0.06] hover:text-gold">
              <Settings className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" /> Notification settings
              <ChevronRight className="ml-auto h-4 w-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-gold" />
            </Link>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertRow({ item, index, isNew, now, onOpen }: { item: AlertRecord; index: number; isNew: boolean; now: number; onOpen: () => void }) {
  const kind = KIND[item.kind];
  const Icon = kind.icon;
  return (
    <motion.li initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index, 6) * 0.03, duration: 0.2 }}>
      <Link href={item.href} onClick={onOpen}
        className={`relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.05] ${isNew ? "bg-gold/[0.06]" : ""}`}>
        {isNew && <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gold" />}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${kind.tile}`}><Icon aria-hidden="true" className={`h-4 w-4 ${kind.color}`} /></div>
        <div className="min-w-0 flex-1">
          <p className={`break-words text-[13px] leading-snug ${isNew ? "font-semibold text-white" : "text-white/70"}`}>{item.text}</p>
          <p className="mt-1 text-[11px] text-white/40">{timeAgo(item.at, now)}</p>
        </div>
        {isNew && <span className="mt-1 shrink-0 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-gold">New</span>}
      </Link>
    </motion.li>
  );
}
