"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { collection, limit, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import Link from "next/link";
import { db } from "@/lib/auth/firebase";
import { useQuest } from "@/hooks/useQuests";
import { questRequest } from "@/lib/quests/client";
import { useQuestNotifications } from "./QuestNotifications";
import { Button } from "@/components/ui/Button";

type Message = { id: string; senderId: string; text: string; createdAt?: Timestamp };

export function QuestMessenger({ id }: { id: string }) {
  const { user, quest, loading, error } = useQuest(id);
  const participant = Boolean(user && quest && (quest.requesterId === user.uid || quest.questRunnerId === user.uid));
  const readable = participant && Boolean(quest && ["accepted", "in_progress", "settlement", "completed", "cancelled"].includes(quest.status));
  const key = `${user?.uid}:${id}`;
  const [feed, setFeed] = useState<{ key: string; messages: Message[]; error?: string }>();
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
    return onSnapshot(query(collection(db, "quests", id, "messages"), orderBy("createdAt", "desc"), limit(100)), (snapshot) => {
      setFeed({ key, messages: snapshot.docs.map((record) => ({ ...record.data(), id: record.id }) as Message).reverse() });
    }, () => setFeed({ key, messages: [], error: "Unable to load messages. Check your connection and refresh to retry." }));
  }, [id, readable, key]);
  useEffect(() => {
    const element = scroller.current;
    if (element && nearBottom.current) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [feed]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true); setSendError("");
    nearBottom.current = true;
    try { await questRequest(`/${encodeURIComponent(id)}/messages`, { text: draft.trim() }); setDraft(""); }
    catch (error) { setSendError(error instanceof Error ? error.message : "Unable to send message."); }
    finally { setSending(false); }
  }
  if (loading) return <p className="page-container py-8 text-white">Loading conversation…</p>;
  if (error || !readable || !quest) return <div className="page-container py-8 text-white"><p role="alert">{error || "Messaging opens after acceptance and is private to the requester and assigned runner."}</p><Link href="/requests" className="underline">Choose a quest in My Requests</Link></div>;
  const current = feed?.key === key ? feed : undefined;
  const other = quest.requesterId === user?.uid ? quest.runnerName : quest.requesterName;
  return <div className="page-container py-6 max-w-4xl"><section className="rounded-2xl bg-white overflow-hidden shadow-xl">
    <header className="border-b p-5"><Link className="text-maroon underline" href={`/quests/active?id=${encodeURIComponent(id)}`}>Back to Quest</Link><h1 className="text-xl font-bold mt-3">{other || "Quest participant"}</h1><p>{quest.title} · {quest.status.replaceAll("_", " ")}</p></header>
    <div ref={scroller} onScroll={() => { const element = scroller.current; if (element) nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100; }} className="h-[50vh] overflow-y-auto p-5 space-y-3" role="log" aria-label="Quest messages" aria-live="polite">
      {!current && <p>Loading messages…</p>}{current?.error && <p role="alert">{current.error}</p>}
      {current && !current.error && !current.messages.length && <p>No messages yet. Confirm your meet-up details here.</p>}
      {current?.messages.map((message) => <div key={message.id} className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.senderId === user?.uid ? "bg-cream" : "bg-gray-100"}`}><span className="text-xs font-semibold">{message.senderId === user?.uid ? "You" : other || "Participant"}</span><p className="whitespace-pre-wrap break-words">{message.text}</p><time className="text-xs text-muted">{message.createdAt?.toDate().toLocaleString()}</time></div></div>)}
    </div>
    <div className="border-t p-4"><p className="text-xs mb-3">Showing the latest 100 messages. Text messaging only.</p>{sendError && <p role="alert" className="text-red-700 mb-3">{sendError}</p>}{["completed", "cancelled"].includes(quest.status) ? <p>This quest is closed. The conversation is read-only.</p> : <form onSubmit={send} className="flex gap-3"><label className="sr-only" htmlFor="message">Message</label><input id="message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} disabled={sending} placeholder="Write a message…" className="min-w-0 flex-1 rounded-xl border p-3" required /><Button type="submit" disabled={sending || !draft.trim()}>{sending ? "Sending…" : "Send"}</Button></form>}</div>
  </section></div>;
}
