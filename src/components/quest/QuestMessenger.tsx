"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { collection, getDocs, limit, onSnapshot, orderBy, query, startAfter, type QueryDocumentSnapshot, type Timestamp } from "firebase/firestore";
import Link from "next/link";
import { db } from "@/lib/auth/firebase";
import { useQuest } from "@/hooks/useQuests";
import { MessengerSkeleton } from "@/components/skeletons/PageSkeletons";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import { questRequest } from "@/lib/quests/client";
import { useQuestNotifications } from "./QuestNotifications";
import { Button } from "@/components/ui/Button";

type Message = { id: string; senderId: string; text: string; createdAt?: Timestamp };
const LIVE_WINDOW = 100, OLDER_PAGE = 50;
// Oldest first. Messages are never edited or deleted, so merging snapshots by id is safe.
const ordered = (docs: Map<string, QueryDocumentSnapshot>) => [...docs.values()].sort((a, b) => (a.data().createdAt?.toMillis() ?? 0) - (b.data().createdAt?.toMillis() ?? 0) || a.id.localeCompare(b.id));

export function QuestMessenger({ id }: { id: string }) {
  const { user, quest, loading, error } = useQuest(id);
  const participant = Boolean(user && quest && (quest.requesterId === user.uid || quest.questRunnerId === user.uid));
  const readable = participant && Boolean(quest && ["accepted", "in_progress", "settlement", "completed", "cancelled"].includes(quest.status));
  const key = `${user?.uid}:${id}`;
  const [feed, setFeed] = useState<{ key: string; messages: Message[]; error?: string }>();
  const docs = useRef(new Map<string, QueryDocumentSnapshot>());
  const [more, setMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState("");
  const keepScroll = useRef<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const { openChat } = useQuestNotifications();
  const loaded = Boolean(feed?.key === key && !feed.error);
  useEffect(() => {
    if (!readable || !loaded) return;
    openChat(id);
    return () => openChat(null);
  }, [id, readable, loaded, openChat]);
  useEffect(() => {
    if (!readable) return;
    docs.current = new Map();
    return onSnapshot(query(collection(db, "quests", id, "messages"), orderBy("createdAt", "desc"), limit(LIVE_WINDOW)), (snapshot) => {
      // The live window slides as new messages arrive, so keep everything already seen.
      const first = docs.current.size === 0;
      for (const record of snapshot.docs) docs.current.set(record.id, record);
      if (first) setMore(snapshot.size === LIVE_WINDOW);
      setFeed({ key, messages: ordered(docs.current).map((record) => ({ ...record.data(), id: record.id }) as Message) });
    }, () => setFeed({ key, messages: [], error: "Unable to load messages. Check your connection and refresh to retry." }));
  }, [id, readable, key]);
  useEffect(() => {
    const element = scroller.current;
    if (element && keepScroll.current !== null) { element.scrollTop += element.scrollHeight - keepScroll.current; keepScroll.current = null; return; }
    if (element && nearBottom.current) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [feed]);
  async function loadOlder() {
    const oldest = ordered(docs.current)[0];
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true); setOlderError("");
    try {
      const page = await getDocs(query(collection(db, "quests", id, "messages"), orderBy("createdAt", "desc"), startAfter(oldest), limit(OLDER_PAGE)));
      keepScroll.current = scroller.current?.scrollHeight ?? null;
      for (const record of page.docs) docs.current.set(record.id, record);
      setMore(page.size === OLDER_PAGE);
      setFeed((current) => current ? { ...current, messages: ordered(docs.current).map((record) => ({ ...record.data(), id: record.id }) as Message) } : current);
    } catch { setOlderError("Could not load older messages. Please try again."); }
    finally { setLoadingOlder(false); }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true); setSendError("");
    nearBottom.current = true;
    try { await questRequest(`/${encodeURIComponent(id)}/messages`, { text: draft.trim() }); setDraft(""); }
    catch (error) { setSendError(error instanceof Error ? error.message : "Unable to send message."); }
    finally { setSending(false); }
  }
  const showSkeleton = useMinimumLoading(loading || (readable && feed?.key !== key)) && !error;
  if (showSkeleton) return <MessengerSkeleton />;
  if (error || !readable || !quest) return <div className="page-container py-8 text-white"><p role="alert">{error || "Messaging opens after acceptance and is private to the requester and assigned runner."}</p><Link href="/requests" className="underline">Choose a quest in My Quests</Link></div>;
  const current = feed?.key === key ? feed : undefined;
  const other = quest.requesterId === user?.uid ? quest.runnerName : quest.requesterName;
  return <div className="page-container py-6 max-w-4xl"><section className="rounded-2xl bg-white overflow-hidden shadow-xl">
    <header className="border-b p-5"><Link className="text-maroon underline" href={`/quests/active?id=${encodeURIComponent(id)}`}>Back to Quest</Link><h1 className="text-xl font-bold mt-3">{other || "Quest participant"}</h1><p>{quest.title} · {quest.status.replaceAll("_", " ")}</p></header>
    <div ref={scroller} onScroll={() => { const element = scroller.current; if (element) nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100; }} className="h-[50vh] overflow-y-auto p-5 space-y-3" role="log" aria-label="Quest messages" aria-live="polite">
      {more && <div className="text-center"><button type="button" onClick={loadOlder} disabled={loadingOlder} className="btn-outline">{loadingOlder ? "Loading…" : "Load older messages"}</button></div>}{olderError && <p role="alert" className="text-red-700">{olderError}</p>}
      {!current && <p>Loading messages…</p>}{current?.error && <p role="alert">{current.error}</p>}
      {current && !current.error && !current.messages.length && <p>No messages yet. Confirm your meet-up details here.</p>}
      {current?.messages.map((message) => <div key={message.id} className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.senderId === user?.uid ? "bg-cream" : "bg-gray-100"}`}><span className="text-xs font-semibold">{message.senderId === user?.uid ? "You" : other || "Participant"}</span><p className="whitespace-pre-wrap break-words">{message.text}</p><time className="text-xs text-muted">{message.createdAt?.toDate().toLocaleString()}</time></div></div>)}
    </div>
    <div className="border-t p-4"><p className="text-xs mb-3">Text messaging only.</p>{sendError && <p role="alert" className="text-red-700 mb-3">{sendError}</p>}{["completed", "cancelled"].includes(quest.status) ? <p>This quest is closed. The conversation is read-only.</p> : <form onSubmit={send} className="flex gap-3"><label className="sr-only" htmlFor="message">Message</label><input id="message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} disabled={sending} placeholder="Write a message…" className="min-w-0 flex-1 rounded-xl border p-3" required /><Button type="submit" disabled={sending || !draft.trim()}>{sending ? "Sending…" : "Send"}</Button></form>}</div>
  </section></div>;
}
