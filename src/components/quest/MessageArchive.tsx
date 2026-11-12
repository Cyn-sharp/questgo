"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query, startAfter, where, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Quest } from "@/types/quest";

export function MessageArchive() {
  const { user } = useAuth();
  const [role, setRole] = useState<"requesterId" | "questRunnerId">("requesterId");
  return <div className="page-container max-w-4xl py-8 text-white">
    <Link href="/profile" className="underline">Back to Profile</Link>
    <h1 className="mt-4 text-3xl font-bold">Message Archive</h1>
    <p className="mt-2">Past completed and cancelled quests. Conversations stay saved and read-only.</p>
    <div className="my-5 flex gap-3">{(["requesterId", "questRunnerId"] as const).map((value) => <button key={value} onClick={() => setRole(value)} aria-pressed={role === value} className={role === value ? "btn-primary" : "btn-outline"}>{value === "requesterId" ? "My posted quests" : "Quests I ran"}</button>)}</div>
    {user && <ArchiveRecords key={`${user.uid}:${role}`} uid={user.uid} field={role} />}
  </div>;
}

function ArchiveRecords({ uid, field }: { uid: string; field: string }) {
  const [records, setRecords] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const cursor = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function load() {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError("");
    try {
      const snapshot = await getDocs(query(collection(db, "quests"), where(field, "==", uid), where("status", "in", ["completed", "cancelled"]), orderBy("createdAt", "desc"), ...(cursor.current ? [startAfter(cursor.current)] : []), limit(10)));
      if (!alive.current) return;
      setRecords((current) => [...new Map([...current, ...snapshot.docs.map((record) => ({ ...record.data(), id: record.id }) as Quest)].map((record) => [record.id, record])).values()]);
      cursor.current = snapshot.docs.at(-1) ?? cursor.current;
      setMore(snapshot.size === 10);
    } catch { if (alive.current) setError("Could not load the archive. Please try again."); }
    finally { busy.current = false; if (alive.current) setLoading(false); }
  }
  useEffect(() => {
    // Mount each account/role independently so a late response cannot mix records.
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>
    <p className="mb-4 text-sm">Newest posted first · 10 transactions at a time</p>
    <div className="space-y-3">{records.map((quest) => <article key={quest.id} className="rounded-xl bg-gray-100 p-5 text-gray-700">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{quest.title}</h2><span className="text-sm capitalize">{quest.status} · Read-only</span></div>
      <p className="my-2 text-sm">{field === "requesterId" ? `Runner: ${quest.runnerName || "No runner assigned"}` : `Requester: ${quest.requesterName || "Requester"}`}</p>
      {quest.questRunnerId ? <Link href={`/messenger?id=${encodeURIComponent(quest.id)}`} className="text-maroon underline">Read conversation</Link> : <p className="text-sm">Cancelled before a runner accepted. No conversation.</p>}
    </article>)}</div>
    {!loading && !error && !records.length && <p>No archived quests yet.</p>}
    {error && <p role="alert" className="mt-4">{error}</p>}
    {loading && <p role="status" className="mt-4">Loading archive…</p>}
    {(more || error) && <button disabled={loading} onClick={load} className="btn-outline mt-4">{error ? "Retry" : "Load older transactions"}</button>}
  </>;
}
