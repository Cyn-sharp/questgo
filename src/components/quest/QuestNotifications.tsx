"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, ArrowRight, X } from "lucide-react";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useBlockedUsers, useNotificationQuests } from "@/hooks/useQuests";
import { conversationPriority, isUnread, selectConversations, unreadQuestIds, type InboxEntry } from "@/lib/quests/conversations";
import { questUpdate } from "@/lib/quests/progress";
import type { Quest } from "@/types/quest";
import { InboxSkeleton } from "@/components/skeletons/PageSkeletons";
import { alertEnabled, DEFAULT_NOTIFICATION_PREFS, newQuestText, parsePrefs, wantsNewQuest, type AlertKind, type NotificationPrefs } from "@/lib/notifications/preferences";
import { showDeviceAlert } from "@/lib/notifications/device";
import { alertId } from "@/lib/notifications/history";
import { recordAlert } from "@/lib/notifications/history-store";

type Inbox = InboxEntry & { title: string; sentAt: Timestamp };
type Notice = { id: number; text: string; href: string };
type NotificationContext = {
  openChat: (id: string | null) => void;
  unreadCount: number;
  unreadIds: Set<string>;
  activeConversations: Quest[];
  closedConversations: Quest[];
  conversationsLoading: boolean;
  conversationsError: string;
  prefs: NotificationPrefs;
  prefsLoaded: boolean;
  prefsError: string;
  savePrefs: (prefs: NotificationPrefs) => Promise<void>;
};

const EMPTY_SET = new Set<string>();
const Context = createContext<NotificationContext>({
  openChat: () => {},
  unreadCount: 0,
  unreadIds: EMPTY_SET,
  activeConversations: [],
  closedConversations: [],
  conversationsLoading: false,
  conversationsError: "",
  prefs: DEFAULT_NOTIFICATION_PREFS,
  prefsLoaded: false,
  prefsError: "",
  savePrefs: async () => { throw new Error("Sign in to change notification settings."); },
});
export const useQuestNotifications = () => useContext(Context);

export function QuestNotifications({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <NotificationsForUser key={user.uid} uid={user.uid}>{children}</NotificationsForUser> : <>{children}</>;
}

function legacyReadMarkers(uid: string): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(`questgo:read-messages:${uid}`) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

function NotificationsForUser({ uid, children }: { uid: string; children: ReactNode }) {
  const { posted, running, loading, error: questError } = useNotificationQuests();
  const [inbox, setInbox] = useState<Inbox[]>([]);
  const [legacySeen] = useState(() => legacyReadMarkers(uid));
  const [panel, setPanel] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [inboxLoaded, setInboxLoaded] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefsError, setPrefsError] = useState("");
  const prefsRef = useRef<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const blocked = useBlockedUsers();
  const blockedRef = useRef<ReadonlySet<string>>(new Set());
  const router = useRouter();
  const activeChat = useRef<string | null>(null);
  const previous = useRef<Map<string, Quest> | null>(null);
  const inboxRef = useRef<Inbox[]>([]);
  const serial = useRef(0);
  const marking = useRef(new Set<string>());

  const announce = useCallback((text: string, href: string) => {
    setNotices((items) => [...items, { id: ++serial.current, text, href }].slice(-20));
  }, []);

  const notify = useCallback((kind: AlertKind, text: string, href: string) => {
    if (kind !== "message") recordAlert(uid, { id: alertId(kind, href, text), kind, text, href, at: Date.now() });
    if (!alertEnabled(prefsRef.current, kind)) return;
    announce(text, href);
    if (document.visibilityState !== "visible" || !document.hasFocus()) showDeviceAlert(text, href, () => router.push(href));
  }, [announce, router, uid]);

  const savePrefs = useCallback(async (next: NotificationPrefs) => {
    await setDoc(doc(db, "users", uid, "preferences", "notifications"), { ...next, updatedAt: serverTimestamp() });
  }, [uid]);

  const markOpenRead = useCallback(() => {
    if (document.visibilityState !== "visible" || !document.hasFocus()) return;
    const item = inboxRef.current.find((entry) => entry.questId === activeChat.current);
    if (!item || item.readMessageId === item.messageId || marking.current.has(item.messageId)) return;
    marking.current.add(item.messageId);
    updateDoc(doc(db, "users", uid, "questInbox", item.questId), { readMessageId: item.messageId, readAt: serverTimestamp() })
      .catch(() => { /* Retried on the next focus or snapshot. */ })
      .finally(() => marking.current.delete(item.messageId));
  }, [uid]);

  const openChat = useCallback((id: string | null) => { activeChat.current = id; markOpenRead(); }, [markOpenRead]);

  useEffect(() => {
    window.addEventListener("focus", markOpenRead);
    document.addEventListener("visibilitychange", markOpenRead);
    return () => {
      window.removeEventListener("focus", markOpenRead);
      document.removeEventListener("visibilitychange", markOpenRead);
    };
  }, [markOpenRead]);

  useEffect(() => onSnapshot(doc(db, "users", uid, "preferences", "notifications"), (snapshot) => {
    prefsRef.current = parsePrefs(snapshot.data());
    setPrefs(prefsRef.current);
    setPrefsLoaded(true);
    setPrefsError("");
  }, () => { setPrefsLoaded(true); setPrefsError("Notification settings could not load. Default alerts are on."); }), [uid]);

  useEffect(() => { blockedRef.current = new Set(blocked.map((entry) => entry.id)); }, [blocked]);

  useEffect(() => {
    if (!prefs.newQuests) return;
    let seen: Set<string> | null = null;
    return onSnapshot(query(collection(db, "quests"), where("status", "==", "available")), (snapshot) => {
      if (seen) for (const change of snapshot.docChanges()) {
        if (change.type !== "added" || seen.has(change.doc.id)) continue;
        const quest = { ...change.doc.data(), id: change.doc.id } as Quest & { expiresAt?: Timestamp };
        if (wantsNewQuest(quest, uid, prefsRef.current, blockedRef.current, Date.now())) {
          notify("newQuest", newQuestText(quest), `/quests/viewquest?id=${encodeURIComponent(quest.id)}`);
        }
      }
      seen = new Set([...(seen || []), ...snapshot.docs.map((record) => record.id)]);
    }, () => {});
  }, [prefs.newQuests, uid, notify]);

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
        if (!isUnread(item, legacySeen)) continue;
        if (activeChat.current !== item.questId || document.visibilityState !== "visible" || !document.hasFocus()) {
          notify("message", `New message about “${item.title}”`, `/messenger?id=${encodeURIComponent(item.questId)}`);
        }
      }
      initialized = true;
      markOpenRead();
    }, () => { setInboxLoaded(true); setError("Message alerts could not connect. Open My Quests to check your chats."); });
  }, [uid, notify, markOpenRead, legacySeen]);

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
      const text = before ? questUpdate(before, quest, quest.requesterId === uid)
        : quest.status === "accepted" ? (quest.requesterId === uid ? "Your quest was accepted! Open chat to arrange the details." : "Quest accepted! Message the requester before you start.") : null;
      if (text) notify("questUpdate", text, `/quests/active?id=${encodeURIComponent(id)}`);
    }
    previous.current = new Map([...previous.current || [], ...quests].slice(-100));
  }, [posted, running, loading, uid, notify]);

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

  const unread = unreadQuestIds(inbox, conversations.map((quest) => quest.id), legacySeen);
  const stillLoading = loading || !inboxLoaded;
  const combinedError = error || questError || "";

  return (
    <Context.Provider
      value={{
        openChat,
        unreadCount: unread.size,
        unreadIds: unread,
        activeConversations: active,
        closedConversations: closed,
        conversationsLoading: stillLoading,
        conversationsError: combinedError,
        prefs,
        prefsLoaded,
        prefsError,
        savePrefs,
      }}
    >
      {children}
      <div className="fixed right-4 bottom-28 md:bottom-6 z-[60]">
        {panel && (
          <section aria-label="Messages" className="mb-3 w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-border bg-white p-4 text-dark shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-dark">Messages</h2>
                {unread.size > 0 && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    {unread.size} new
                  </span>
                )}
              </div>
              <button type="button" aria-label="Close messages" onClick={() => setPanel(false)} className="rounded-lg p-1.5 text-muted hover:bg-stone-100 hover:text-dark">
                <X size={18} />
              </button>
            </div>

            {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
            {questError && <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">Some quest updates could not connect. Ongoing chats still appear below.</p>}

            {stillLoading ? (
              <InboxSkeleton />
            ) : (
              <div className="mt-1 max-h-72 overflow-y-auto pr-1">
                {[
                  { label: "Ongoing quests", records: active, muted: false },
                  { label: "Recent closed", records: closed, muted: true },
                ].map((group) => (
                  <div key={group.label}>
                    <h3 className="mt-3 mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">{group.label}</h3>
                    {!group.records.length && <p className="py-1.5 text-sm text-muted">None yet.</p>}
                    {group.records.map((quest) => {
                      const other = quest.requesterId === uid ? quest.runnerName : quest.requesterName;
                      const hasUnread = unread.has(quest.id);
                      return (
                        <Link
                          key={quest.id}
                          href={`/messenger?id=${encodeURIComponent(quest.id)}`}
                          onClick={() => setPanel(false)}
                          className={`my-1 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                            group.muted
                              ? "border-stone-200 bg-stone-50 text-muted hover:bg-stone-100"
                              : hasUnread
                                ? "border-maroon/30 bg-amber-50 text-dark hover:bg-amber-100"
                                : "border-border bg-cream/70 text-dark hover:bg-amber-50"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{quest.title}</span>
                            <span className="block truncate text-xs text-muted">
                              {other || "Participant"} · <span className="capitalize">{quest.status.replaceAll("_", " ")}</span>
                              {group.muted && " · Read-only"}
                            </span>
                          </span>
                          {hasUnread && <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">New</span>}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs font-semibold text-maroon">
              <Link href="/messenger" onClick={() => setPanel(false)} className="inline-flex items-center gap-1 hover:underline">
                Open Messenger <ArrowRight size={13} />
              </Link>
              <Link href="/profile/archive" onClick={() => setPanel(false)} className="hover:underline">
                Archive
              </Link>
              <Link href="/requests" onClick={() => setPanel(false)} className="hover:underline">
                My Quests
              </Link>
            </div>
          </section>
        )}
        <button
          type="button"
          aria-label={`Messages${unread.size ? `, ${unread.size} unread conversations` : ""}`}
          aria-expanded={panel}
          onClick={() => setPanel((open) => !open)}
          className="relative ml-auto flex items-center gap-2 rounded-full border border-white/30 bg-maroon px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-maroon-dark"
        >
          <MessageCircle size={20} />
          <span>Messages</span>
          {unread.size > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-red-500" />}
        </button>
      </div>
      <div className="fixed top-4 left-4 right-4 z-[70] mx-auto max-w-md" role="status" aria-live="polite" aria-atomic="true">
        {notice && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 text-dark shadow-xl">
            <Link className="flex-1 text-sm font-semibold" href={notice.href}>{notice.text}</Link>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotices((items) => items.filter((item) => item.id !== notice.id))}>
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}