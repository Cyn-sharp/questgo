"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, MessageSquareText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sortByAge } from "@/lib/admin/presentation";
import { AdminEmptyState, AdminErrorState, AdminLoadingRows, AdminPageHeading, AdminPanel, AdminStatusChip } from "@/components/admin/ConsoleUI";

type Entry = { id: string; senderId?: string; actorName?: string; action?: string; text?: string; reason?: string; createdAt?: string | null; amount?: number; evidence?: string };
type ReviewData = { events: Entry[]; messages: Entry[] };

function Review() {
  const id = useSearchParams().get("id") || "";
  const { user } = useAuth();
  const [data, setData] = useState<ReviewData>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!user) throw new Error("Sign in as an administrator.");
    if (!id) throw new Error("A quest ID is required to inspect a case.");
    const response = await fetch("/api/admin/quests/" + encodeURIComponent(id), { headers: { Authorization: "Bearer " + await user.getIdToken() }, cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Unable to load case records.");
    return body as ReviewData;
  }, [user, id]);
  useEffect(() => {
    let current = true;
    void load().then((result) => { if (current) setData(result); })
      .catch((e) => { if (current) setError(e instanceof Error ? e.message : "Unable to load case records."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [load]);
  async function refresh() {
    setLoading(true); setError("");
    try { setData(await load()); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load case records."); }
    finally { setLoading(false); }
  }

  const events = useMemo(() => sortByAge(data?.events ?? [], "oldest"), [data]);
  const messages = useMemo(() => sortByAge(data?.messages ?? [], "oldest"), [data]);

  return <div className="mx-auto max-w-[1500px]">
    <AdminPageHeading eyebrow="Case file" title="Case review" description="Review the recorded activity and conversation before making a queue decision." action={<Link href="/admin" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">Back to settlement queue</Link>} />
    <AdminPanel className="sticky top-0 z-10 mb-5 rounded-xl p-4 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Quest record</p><p className="mt-1 break-all font-mono text-sm font-semibold text-slate-950">{id || "Quest ID unavailable"}</p></div><AdminStatusChip tone="neutral">Review context</AdminStatusChip></div>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">{[["Participants", "Not supplied by the current case endpoint"], ["Funding method", "Not supplied by the current case endpoint"], ["Recorded expense", "Not supplied by the current case endpoint"], ["Quest title", "Not supplied by the current case endpoint"]].map(([label, value]) => <div key={label} className="border-t border-slate-200 pt-2"><dt className="font-medium text-slate-600">{label}</dt><dd className="mt-1 text-slate-800">{value}</dd></div>)}</dl>
    </AdminPanel>
    {error && <div className="mb-4"><AdminErrorState message={error} onRetry={() => void refresh()} /></div>}
    {loading && <AdminPanel className="rounded-xl"><AdminLoadingRows label="Loading case activity and messages" columns={3} rows={5} /></AdminPanel>}
    {!loading && !error && data && <div className="grid items-start gap-4 xl:grid-cols-2">
      <AdminPanel className="overflow-hidden rounded-xl"><div className="flex items-center gap-2 border-b border-slate-200 p-4"><Activity size={17} className="text-maroon" aria-hidden="true" /><div><h2 className="text-base font-semibold">Activity timeline</h2><p className="text-xs text-slate-600">Latest {data.events.length} activity records, oldest first in this batch.</p></div></div>{!events.length ? <AdminEmptyState>No activity records are available.</AdminEmptyState> : <ol className="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto">{events.map((entry) => <li key={entry.id} className="relative px-4 py-4 pl-8 before:absolute before:bottom-0 before:left-4 before:top-0 before:w-px before:bg-slate-200 first:before:top-5 last:before:bottom-5"><span aria-hidden="true" className="absolute left-[11px] top-5 h-2 w-2 rounded-full bg-maroon ring-2 ring-white" /><div className="flex flex-wrap items-center justify-between gap-2"><AdminStatusChip tone="neutral">{(entry.action || "Activity").replaceAll("-", " ")}</AdminStatusChip><time className="text-xs text-slate-600">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Time unavailable"}</time></div><p className="mt-2 text-xs text-slate-700">{entry.actorName || "System"}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{entry.reason || entry.text || "No additional details recorded."}</p>{entry.amount !== undefined && <p className="mt-2 font-mono text-xs tabular-nums text-slate-800">Recorded amount: ₱{entry.amount} {entry.evidence ? `· ${entry.evidence}` : ""}</p>}</li>)}</ol>}</AdminPanel>
      <AdminPanel className="overflow-hidden rounded-xl"><div className="flex items-center gap-2 border-b border-slate-200 p-4"><MessageSquareText size={17} className="text-maroon" aria-hidden="true" /><div><h2 className="text-base font-semibold">Quest messages</h2><p className="text-xs text-slate-600">Latest {data.messages.length} messages, oldest first in this batch.</p></div></div>{!messages.length ? <AdminEmptyState>No messages are available for this case.</AdminEmptyState> : <ol className="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto">{messages.map((entry) => <li key={entry.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-900">{entry.actorName || (entry.senderId ? "Participant" : "Unknown sender")}</p><time className="text-xs text-slate-600">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Time unavailable"}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-900">{entry.text || "Empty message"}</p></li>)}</ol>}</AdminPanel>
    </div>}
  </div>;
}

export default function Page() { return <Suspense fallback={<div role="status" className="p-4 text-sm text-slate-700">Loading case review…</div>}><Review /></Suspense>; }
