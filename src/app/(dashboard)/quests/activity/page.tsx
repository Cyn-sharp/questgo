"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
type Event = { id: string; actorName?: string; action: string; reason?: string; fromStatus?: string; toStatus?: string; createdAt?: string };
function Activity() {
  const id = useSearchParams().get("id") || "", { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]), [error, setError] = useState("");
  useEffect(() => { let current = true; if (!user || !id) return; void (async () => { try { const response = await fetch("/api/quests/" + encodeURIComponent(id) + "/activity", { headers: { Authorization: "Bearer " + await user.getIdToken() } }); const body = await response.json(); if (!response.ok) throw new Error(body.message); if (current) setEvents(body.events); } catch (e) { if (current) setError(e instanceof Error ? e.message : "Unable to load history."); } })(); return () => { current = false; }; }, [user, id]);
  return <div className="page-container py-8"><section className="rounded-xl bg-white p-6 space-y-4"><Link className="underline" href={"/quests/active?id=" + encodeURIComponent(id)}>Back to quest</Link><h1 className="text-2xl font-bold">Quest activity</h1><p className="text-sm">Latest 100 recorded actions. Older quests may have actions from before activity recording began.</p>{error && <p role="alert">{error}</p>}{events.map((event) => <article key={event.id} className="border-b py-3"><p className="font-semibold">{event.action.replaceAll("-", " ")} · {event.actorName || "Participant / administrator"}</p><p>{event.fromStatus} → {event.toStatus}</p><p className="whitespace-pre-wrap">{event.reason}</p><time className="text-xs">{event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}</time></article>)}</section></div>;
}
export default function Page() { return <Suspense fallback={<p>Loading activity…</p>}><Activity /></Suspense>; }
