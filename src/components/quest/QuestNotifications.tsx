"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationQuests } from "@/hooks/useQuests";
import { conversationPriority, selectConversations } from "@/lib/quests/conversations";
import { questUpdate } from "@/lib/quests/progress";
import type { Quest } from "@/types/quest";

type Inbox = { questId: string; title: string; messageId: string; sentAt: Timestamp };
type Notice = { id: number; text: string; href: string };
const Context = createContext<{ openChat: (id: string | null) => void }>({ openChat: () => {} });
export const useQuestNotifications = () => useContext(Context);

export function QuestNotifications({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // A keyed child discards all private state when the signed-in account changes.
  return user ? <NotificationsForUser key={user.uid} uid={user.uid}>{children}</NotificationsForUser> : <>{children}</>;
}

function NotificationsForUser({ uid, children }: { uid: string; children: ReactNode }) {
  const { posted, running, loading, error: questError } = useNotificationQuests();
  const [inbox, setInbox] = useState<Inbox[]>([]);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [inboxLoaded, setInboxLoaded] = useState(false);
  const activeChat = useRef<string | null>(null);
  const previous = useRef<Map<string, Quest> | null>(null);
  const inboxRef = useRef<Inbox[]>([]);
  const serial = useRef(0);
  const storageKey = `questgo:read-messages:${uid}`;
  const announce = useCallback((text: string, href: string) => {
    setNotices((items) => [...items, { id: ++serial.current, text, href }].slice(-20));
  }, []);
  const markOpenRead = useCallback(() => {
    if (document.visibilityState !== "visible" || !document.hasFocus()) return;
    const item = inboxRef.current.find((entry) => entry.questId === activeChat.current);
    if (!item) return;
    setSeen((current) => {
      const next = { ...current, [item.questId]: item.messageId };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Memory still works when storage is disabled. */ }
      return next;
    });
  }, [storageKey]);
  const openChat = useCallback((id: string | null) => { activeChat.current = id; markOpenRead(); }, [markOpenRead]);

  useEffect(() => {
    const load = () => {
      try {
        const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
        if (value && typeof value === "object" && !Array.isArray(value)) setSeen(value);
      } catch { /* Use in-memory read state. */ }
    };
    load();
    const sync = (event: StorageEvent) => { if (event.key === storageKey) load(); };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", markOpenRead);
    document.addEventListener("visibilitychange", markOpenRead);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", markOpenRead);
      document.removeEventListener("visibilitychange", markOpenRead);
    };
  }, [storageKey, markOpenRead]);

  useEffect(() => {
    let initialized = false;
    return onSnapshot(collection(db, "users", uid, "questInbox"), (snapshot) => {
      inboxRef.current = snapshot.docs.map((record) => record.data() as Inbox);
      setInbox(inboxRef.current);
      setInboxLoaded(true);
      setError("");
      if (initialized) for (const change of snapshot.docChanges()) {
        if (change.type === "removed") continue;
        const item = change.doc.data() as Inbox;
        if (activeChat.current !== item.questId || document.visibilityState !== "visible" || !document.hasFocus()) {
          announce(`New message about “${item.title}”`, `/messenger?id=${encodeURIComponent(item.questId)}`);
        }
      }
      initialized = true;
      markOpenRead();
    }, () => { setInboxLoaded(true); setError("Message alerts could not connect. Open My Quests to check your chats."); });
  }, [uid, announce, markOpenRead]);

  useEffect(() => {
    if (!panel) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPanel(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [panel]);

  useEffect(() => {
    if (loading) return;
    const quests = new Map([...posted, ...running].map((quest) => [quest.id, quest]));
    if (previous.current) for (const [id, quest] of quests) {
      const before = previous.current.get(id);
      // A newly assigned runner did not have this quest in their previous list.
      const text = before ? questUpdate(before, quest, quest.requesterId === uid)
        : quest.status === "accepted" ? (quest.requesterId === uid ? "Your quest was accepted! Open chat to arrange the details." : "Quest accepted! Message the requester before you start.") : null;
      if (text) announce(text, `/quests/active?id=${encodeURIComponent(id)}`);
    }
    // A quest can leave the active query before it enters the closed query.
    // Keep a small transition baseline so that completion is still announced.
    previous.current = new Map([...previous.current || [], ...quests].slice(-100));
  }, [posted, running, loading, uid, announce]);

  const { active, closed } = selectConversations([...posted, ...running]);
  const conversations = [...active, ...closed];
  const questMap = new Map([...posted, ...running].map((quest) => [quest.id, quest]));
  const priority = (item: Notice) => conversationPriority(questMap.get(decodeURIComponent(item.href.split("?id=")[1] || ""))?.status || "");
  const notice = [...notices].sort((a, b) => priority(a) - priority(b) || a.id - b.id)[0];
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotices((items) => items.filter((item) => item.id !== notice.id)), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const unread = inbox.filter((item) => conversations.some((quest) => quest.id === item.questId) && seen[item.questId] !== item.messageId);

  return <Context.Provider value={{ openChat }}>
    {children}
    <div className="fixed right-4 bottom-28 md:bottom-6 z-[60]">
      {panel && <section aria-label="Messages" className="mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border bg-white p-4 text-gray-900 shadow-xl">
        <div className="flex justify-between items-center"><h2 className="font-bold">Messages {unread.length > 0 && `(${unread.length} unread)`}</h2><button aria-label="Close messages" onClick={() => setPanel(false)} className="p-2"><X size={18} /></button></div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {questError && <p role="alert" className="text-sm text-red-700">Quest updates could not connect. Refresh to retry.</p>}
        {!inboxLoaded && <p role="status" className="py-3 text-sm">Loading messages…</p>}
        <div className="max-h-72 overflow-y-auto">{[{ label: "Ongoing quests", records: active, muted: false }, { label: "Last 3 closed conversations", records: closed, muted: true }].map((group) => <div key={group.label}>
          <h3 className="mt-3 text-xs font-bold uppercase text-gray-500">{group.label}</h3>
          {!group.records.length && <p className="py-2 text-sm text-gray-500">None yet.</p>}
          {group.records.map((quest) => <Link key={quest.id} href={`/messenger?id=${encodeURIComponent(quest.id)}`} onClick={() => setPanel(false)} className={`my-1 flex items-center justify-between gap-3 rounded-lg p-3 text-sm ${group.muted ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-amber-50 text-gray-900 hover:bg-amber-100"}`}>
            <span className="min-w-0 break-words"><span className="block font-semibold">{quest.title}</span><span className="text-xs capitalize">{quest.status.replaceAll("_", " ")}{group.muted && " ? Read-only"}</span></span>
            {unread.some((item) => item.questId === quest.id) && <span className="shrink-0 text-xs font-bold text-red-600">New</span>}
          </Link>)}
        </div>)}</div>
        <Link href="/profile/archive" onClick={() => setPanel(false)} className="mt-3 block text-sm font-semibold text-maroon underline">Open message archive</Link>
        <Link href="/requests" onClick={() => setPanel(false)} className="mt-3 block text-sm font-semibold text-maroon underline">View all my quests</Link>
      </section>}
      <button type="button" aria-label={`Messages${unread.length ? `, ${unread.length} unread conversations` : ""}`} aria-expanded={panel} onClick={() => setPanel((open) => !open)} className="relative ml-auto flex items-center gap-2 rounded-full bg-[#7a1f32] px-5 py-3 text-white shadow-xl border border-white/30"><MessageCircle size={22} /><span>Messages</span>{unread.length > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-red-500" />}</button>
    </div>
    <div className="fixed top-4 left-4 right-4 z-[70] mx-auto max-w-md" role="status" aria-live="polite" aria-atomic="true">{notice && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 text-gray-900 shadow-xl"><Link className="flex-1 text-sm font-semibold" href={notice.href}>{notice.text}</Link><button aria-label="Dismiss notification" onClick={() => setNotices((items) => items.filter((item) => item.id !== notice.id))}><X size={18} /></button></div>}</div>
  </Context.Provider>;
}
