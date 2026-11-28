"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { collection, getDocs, limit, onSnapshot, orderBy, query, startAfter, type QueryDocumentSnapshot, type Timestamp } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Lock, MessageCircle, Send } from "lucide-react";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useQuest } from "@/hooks/useQuests";
import { MessengerSkeleton } from "@/components/skeletons/PageSkeletons";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import { questRequest } from "@/lib/quests/client";
import { useQuestNotifications } from "./QuestNotifications";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/Button";
import { LIVE_LIMIT, PAGE_SIZE, mayHaveOlder, mergeMessages } from "@/lib/quests/messagePaging";
import type { Quest } from "@/types/quest";

type Message = { id: string; senderId: string; text: string; createdAt?: Timestamp; snapshot: QueryDocumentSnapshot };
const toMessage = (record: QueryDocumentSnapshot) => ({ ...record.data(), id: record.id, snapshot: record }) as Message;

function formatMessageTime(ts?: Timestamp) {
  if (!ts?.toDate) return "Sending…";
  return ts.toDate().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDayLabel(ts?: Timestamp) {
  if (!ts?.toDate) return "Today";
  const d = ts.toDate();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

function AvatarInitial({ name, mine = false }: { name?: string; mine?: boolean }) {
  const initial = name?.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        mine ? "bg-maroon text-white" : "bg-parchment text-maroon"
      }`}
    >
      {initial}
    </span>
  );
}

function ConversationSidebar({
  selectedId,
  uid,
  active,
  closed,
  unreadIds,
  loading,
}: {
  selectedId: string;
  uid: string;
  active: Quest[];
  closed: Quest[];
  unreadIds: Set<string>;
  loading: boolean;
}) {
  const groups = [
    { label: "Ongoing", records: active, muted: false },
    { label: "Recent closed", records: closed, muted: true },
  ];
  const hasAny = active.length > 0 || closed.length > 0;

  return (
    <aside aria-label="Quest conversations" className="flex flex-col border-b border-border bg-cream/60 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h2 className="font-display text-lg font-bold text-dark">Chats</h2>
        <Link href="/profile/archive" className="text-xs font-semibold text-maroon hover:underline">
          Archive
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {loading && <p className="px-2 py-4 text-sm text-muted">Loading conversations…</p>}
        {!loading && !hasAny && (
          <div className="rounded-xl border border-dashed border-border bg-white p-4 text-center">
            <MessageCircle className="mx-auto h-7 w-7 text-maroon/60" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-dark">No conversations yet</p>
            <p className="mt-1 text-xs text-muted">Messaging unlocks once a quest is accepted.</p>
            <Link href="/quests" className="mt-3 inline-block text-xs font-semibold text-maroon underline">
              Browse quests
            </Link>
          </div>
        )}

        {!loading && groups.map((group) => group.records.length > 0 && (
          <div key={group.label}>
            <p className="px-2 pb-1.5 text-xs font-bold uppercase tracking-wide text-muted">{group.label}</p>
            <ul className="space-y-1.5">
              {group.records.map((item) => {
                const other = item.requesterId === uid ? item.runnerName : item.requesterName;
                const activeItem = item.id === selectedId;
                const unread = unreadIds.has(item.id);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/messenger?id=${encodeURIComponent(item.id)}`}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                        activeItem
                          ? "border-maroon/40 bg-white shadow-sm"
                          : group.muted
                            ? "border-transparent bg-transparent opacity-80 hover:bg-white/70"
                            : "border-transparent bg-white/60 hover:bg-white"
                      }`}
                    >
                      <AvatarInitial name={other} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-dark">{other || "Participant"}</span>
                          {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" aria-label="Unread" />}
                        </div>
                        <p className="truncate text-xs text-muted">{item.title}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function QuestMessenger({ id }: { id: string }) {
  const { user: authUser } = useAuth();
  const { activeConversations, closedConversations, unreadIds, conversationsLoading, openChat } = useQuestNotifications();

  if (!id) {
    return (
      <div className="page-container max-w-5xl py-6">
        <div className="grid min-h-[70vh] overflow-hidden rounded-2xl border border-border bg-white shadow-xl lg:grid-cols-[320px_1fr]">
          <ConversationSidebar
            selectedId=""
            uid={authUser?.uid ?? ""}
            active={activeConversations}
            closed={closedConversations}
            unreadIds={unreadIds}
            loading={conversationsLoading}
          />
          <div className="hidden flex-col items-center justify-center p-10 text-center lg:flex">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-parchment text-maroon">
              <MessageCircle size={26} aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-dark">Select a conversation</h1>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Choose an ongoing or recent quest chat on the left to message your requester or runner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <ActiveMessenger id={id} openChat={openChat} activeConversations={activeConversations} closedConversations={closedConversations} unreadIds={unreadIds} conversationsLoading={conversationsLoading} />;
}

function ActiveMessenger({
  id,
  openChat,
  activeConversations,
  closedConversations,
  unreadIds,
  conversationsLoading,
}: {
  id: string;
  openChat: (id: string | null) => void;
  activeConversations: Quest[];
  closedConversations: Quest[];
  unreadIds: Set<string>;
  conversationsLoading: boolean;
}) {
  const { user, quest, loading, error } = useQuest(id);
  const participant = Boolean(user && quest && (quest.requesterId === user.uid || quest.questRunnerId === user.uid));
  const readable = participant && Boolean(quest && ["accepted", "in_progress", "settlement", "completed", "cancelled"].includes(quest.status));
  const key = `${user?.uid}:${id}`;
  const [feed, setFeed] = useState<{ key: string; messages: Message[]; hasOlder: boolean; error?: string }>();
  const [olderLoading, setOlderLoading] = useState(false);
  const [olderError, setOlderError] = useState("");
  const anchor = useRef<{ height: number; top: number }>(null);
  const activeKey = useRef(key);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const loaded = Boolean(feed?.key === key && !feed.error);

  useEffect(() => {
    if (!readable || !loaded) return;
    openChat(id);
    return () => openChat(null);
  }, [id, readable, loaded, openChat]);

  useEffect(() => { activeKey.current = key; }, [key]);

  useEffect(() => {
    if (!readable) return;
    return onSnapshot(query(collection(db, "quests", id, "messages"), orderBy("createdAt", "desc"), limit(LIVE_LIMIT)), (snapshot) => {
      const incoming = snapshot.docs.map(toMessage);
      setFeed((previous) => previous?.key === key
        ? { key, messages: mergeMessages(previous.messages, incoming), hasOlder: previous.hasOlder }
        : { key, messages: mergeMessages([], incoming), hasOlder: mayHaveOlder(snapshot.size, LIVE_LIMIT) });
    }, () => setFeed({ key, messages: [], hasOlder: false, error: "Unable to load messages. Check your connection and refresh to retry." }));
  }, [id, readable, key]);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    if (anchor.current) {
      element.scrollTop = anchor.current.top + element.scrollHeight - anchor.current.height;
      anchor.current = null;
    } else if (nearBottom.current) {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    }
  }, [feed]);

  async function loadOlder() {
    const oldest = feed?.key === key ? feed.messages[0] : undefined;
    if (!oldest || olderLoading) return;
    setOlderLoading(true); setOlderError("");
    try {
      const page = await getDocs(query(collection(db, "quests", id, "messages"), orderBy("createdAt", "desc"), startAfter(oldest.snapshot), limit(PAGE_SIZE)));
      if (activeKey.current !== key) return;
      const element = scroller.current;
      if (element && page.size) anchor.current = { height: element.scrollHeight, top: element.scrollTop };
      setFeed((previous) => previous?.key === key ? { ...previous, messages: mergeMessages(previous.messages, page.docs.map(toMessage)), hasOlder: mayHaveOlder(page.size, PAGE_SIZE) } : previous);
    } catch { setOlderError("Unable to load older messages. Try again."); }
    finally { setOlderLoading(false); }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true); setSendError("");
    nearBottom.current = true;
    try {
      await questRequest(`/${encodeURIComponent(id)}/messages`, { text: draft.trim() });
      setDraft("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  const showSkeleton = useMinimumLoading(loading || (readable && feed?.key !== key)) && !error;
  if (showSkeleton) return <MessengerSkeleton />;

  if (error || !readable || !quest) {
    return (
      <div className="page-container max-w-xl py-10">
        <div className="rounded-2xl bg-white p-6 text-center shadow-xl">
          <p role="alert" className="text-sm font-semibold text-red-700">
            {error || "Messaging opens after acceptance and is private to the requester and assigned runner."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/messenger" className="btn-outline !py-2">All Chats</Link>
            <Link href="/requests" className="btn-primary !py-2">My Quests</Link>
          </div>
        </div>
      </div>
    );
  }

  const current = feed?.key === key ? feed : undefined;
  const isRequester = quest.requesterId === user?.uid;
  const other = isRequester ? quest.runnerName : quest.requesterName;
  const closed = ["completed", "cancelled"].includes(quest.status);

  return (
    <div className="page-container max-w-5xl py-4 sm:py-6">
      <div className="grid overflow-hidden rounded-2xl border border-border bg-white shadow-xl lg:grid-cols-[300px_1fr]">
        <div className="hidden lg:block">
          <ConversationSidebar
            selectedId={id}
            uid={user?.uid ?? ""}
            active={activeConversations}
            closed={closedConversations}
            unreadIds={unreadIds}
            loading={conversationsLoading}
          />
        </div>

        <section className="flex h-[calc(100dvh-11rem)] min-h-[420px] flex-col md:h-[72vh]">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/messenger"
                aria-label="All conversations"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-dark hover:bg-stone-100 lg:hidden"
              >
                <ArrowLeft size={18} />
              </Link>
              <AvatarInitial name={other} />
              <div className="min-w-0">
                <h1 className="truncate font-display text-base font-bold text-dark sm:text-lg">
                  {other || (isRequester ? "Assigned Runner" : "Requester")}
                </h1>
                <p className="truncate text-xs text-muted">{quest.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={quest.status} />
              <Link
                href={`/quests/active?id=${encodeURIComponent(id)}`}
                className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-cream"
              >
                Open Quest <ExternalLink size={13} aria-hidden="true" />
              </Link>
            </div>
          </header>

          <div
            ref={scroller}
            onScroll={() => {
              const element = scroller.current;
              if (element) nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
            }}
            className="flex-1 space-y-3 overflow-y-auto bg-cream/40 px-4 py-4 sm:px-5"
            role="log"
            aria-label="Quest messages"
            aria-live="polite"
          >
            {current?.hasOlder && !current.error && (
              <div className="text-center">
                {olderError && <p role="alert" className="mb-2 text-xs font-medium text-red-700">{olderError}</p>}
                <Button type="button" variant="outline" onClick={loadOlder} disabled={olderLoading}>
                  {olderLoading ? "Loading older messages…" : "Load older messages"}
                </Button>
              </div>
            )}

            {!current && <p className="text-center text-sm text-muted">Loading messages…</p>}
            {current?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{current.error}</p>}

            {current && !current.error && !current.messages.length && (
              <div className="mx-auto my-8 max-w-sm rounded-2xl border border-border bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-semibold text-dark">No messages yet</p>
                <p className="mt-1 text-xs text-muted">
                  Confirm pickup instructions, meet-up spot ({quest.meetUpPoint}), and timing here.
                </p>
              </div>
            )}

            {current?.messages.map((message, index) => {
              const mine = message.senderId === user?.uid;
              const prevMessage = current.messages[index - 1];
              const dayLabel = formatDayLabel(message.createdAt);
              const showDay = !prevMessage || formatDayLabel(prevMessage.createdAt) !== dayLabel;
              const sameSender = Boolean(prevMessage && !showDay && prevMessage.senderId === message.senderId);

              return (
                <div key={message.id}>
                  {showDay && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full border border-border bg-white px-3 py-0.5 text-xs font-medium text-muted">
                        {dayLabel}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[75%] ${
                        mine ? "rounded-br-md bg-maroon text-white" : "rounded-bl-md border border-border bg-white text-dark"
                      }`}
                    >
                      {!sameSender && (
                        <span className={`mb-0.5 block text-xs font-semibold ${mine ? "text-parchment" : "text-maroon"}`}>
                          {mine ? "You" : other || "Participant"}
                        </span>
                      )}
                      <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${mine ? "text-white" : "text-dark"}`}>
                        {message.text}
                      </p>
                      <time className={`mt-1 block text-right text-xs ${mine ? "text-white/75" : "text-muted"}`}>
                        {formatMessageTime(message.createdAt)}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border bg-white p-3 sm:p-4">
            {sendError && <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{sendError}</p>}

            {closed ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-100 px-4 py-3 text-xs text-muted">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Lock size={14} aria-hidden="true" />
                  This quest is {quest.status}. The conversation is read-only.
                </span>
                {quest.status === "completed" && (
                  <Link href={`/requests/rate?id=${encodeURIComponent(id)}`} className="font-semibold text-maroon underline">
                    Rate {isRequester ? "Runner" : "Requester"}
                  </Link>
                )}
              </div>
            ) : (
              <form onSubmit={send} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor="message">Message</label>
                  <input
                    id="message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={2000}
                    disabled={sending}
                    placeholder="Write a message…"
                    className="min-w-0 flex-1 rounded-xl border border-field/50 bg-cream/50 px-4 py-2.5 text-sm text-dark outline-none transition focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20"
                    required
                  />
                  <Button type="submit" disabled={sending || !draft.trim()} className="shrink-0 gap-1.5">
                    <Send size={15} aria-hidden="true" />
                    <span>{sending ? "Sending…" : "Send"}</span>
                  </Button>
                </div>
                <div className="flex items-center justify-between px-1 text-xs text-muted">
                  <span>Text messaging only · Keep meet-ups in public campus areas</span>
                  {draft.length > 1600 && <span>{draft.length}/2000</span>}
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}