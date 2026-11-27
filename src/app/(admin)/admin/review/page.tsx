"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, MessageSquareText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { money } from "@/lib/quests/funding";
import { caseEventLabel, caseReason, fundingLabel, questStatusLabel, sortByAge } from "@/lib/admin/presentation";
import { AdminEmptyState, AdminErrorState, AdminLoadingRows, AdminPageHeading, AdminPanel, AdminStatusChip } from "@/components/admin/ConsoleUI";

type Entry = { id: string; senderId?: string; actorName?: string; role?: string; action?: string; text?: string; reason?: string; createdAt?: string | null; amount?: number; evidence?: string };
type Quest = { id: string; title: string; status: string; requesterName: string; runnerName: string; fundingMethod: string; reward: number; actualExpense: number; expenseEvidence: string; expenseApproved: boolean; receiptRecorded: boolean; closedReason: string; issueReason: string; resolutionNote: string; requesterConfirmed: boolean; runnerConfirmed: boolean };
type ReviewData = { quest: Quest; events: Entry[]; messages: Entry[] };

const phTime = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
const when = (value?: string | null) => (value ? phTime.format(new Date(value)) : "Time unavailable");
const ROLES: Record<string, string> = { requester: "Requester", runner: "Runner", admin: "Admin" };

function RoleTag({ role }: { role?: string }) {
  if (!role || !ROLES[role]) return null;
  return <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${role === "runner" ? "bg-amber-50 text-amber-900" : role === "requester" ? "bg-sky-50 text-sky-900" : "bg-slate-100 text-slate-700"}`}>{ROLES[role]}</span>;
}

// The facts an admin needs before deciding: who is involved, the money, and why the quest stopped.
function caseFacts(quest: Quest) {
  const facts: [string, string][] = [
    ["Requester", quest.requesterName || "Unknown"],
    ["Runner", quest.runnerName || "No runner yet"],
    ["Funding", fundingLabel(quest.fundingMethod)],
    ["Reward", money(quest.reward)],
    ["Cost", quest.actualExpense ? `${money(quest.actualExpense)} (${quest.receiptRecorded ? "actual cost from the receipt" : "quoted cost"})\n${quest.expenseApproved ? "Approved by the requester" : "Not approved by the requester yet"}` : "None recorded"],
    ["Receipt or quote details", quest.expenseEvidence || "None recorded"],
  ];
  if (quest.status === "settlement" || quest.closedReason) facts.push(["Why it stopped", caseReason(quest.closedReason) + (quest.issueReason ? `\n“${quest.issueReason}”` : "")]);
  else if (quest.issueReason) facts.push(["Problem reported", `“${quest.issueReason}”`]);
  if (quest.status === "settlement") facts.push(["Settled between them?", `Requester: ${quest.requesterConfirmed ? "yes" : "not yet"} · Runner: ${quest.runnerConfirmed ? "yes" : "not yet"}`]);
  if (quest.resolutionNote) facts.push(["Admin decision", quest.resolutionNote]);
  return facts;
}

function Review() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  // Go back to the page the admin came from.
  const back = params.get("from") === "reports" ? { href: "/admin/reports", label: "Back to user reports" } : { href: "/admin", label: "Back to settlement queue" };
  const { user, isLoading } = useAuth();
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
    // Wait until Firebase has finished loading the login before asking for data.
    if (isLoading) return;
    let current = true;
    void load().then((result) => { if (current) { setData(result); setError(""); } })
      .catch((e) => { if (current) setError(e instanceof Error ? e.message : "Unable to load case records."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [isLoading, load]);
  async function refresh() {
    setLoading(true); setError("");
    try { setData(await load()); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load case records."); }
    finally { setLoading(false); }
  }

  const events = useMemo(() => sortByAge(data?.events ?? [], "oldest"), [data]);
  const messages = useMemo(() => sortByAge(data?.messages ?? [], "oldest"), [data]);
  const quest = data?.quest;

  return <div className="mx-auto max-w-[1500px]">
    <AdminPageHeading eyebrow="Case file" title="Case review" description="Review the recorded activity and conversation before making a queue decision." action={<Link href={back.href} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">{back.label}</Link>} />
    <AdminPanel className="mb-5 rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Quest</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{quest ? quest.title || "Untitled quest" : loading ? "Loading…" : "Quest details unavailable"}</h2><p className="mt-1 break-all font-mono text-xs text-slate-500">{id || "Quest ID unavailable"}</p></div>{quest && <AdminStatusChip tone={quest.status === "settlement" ? "warning" : "neutral"}>{questStatusLabel(quest.status)}</AdminStatusChip>}</div>
      {quest && <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">{caseFacts(quest).map(([label, value]) => <div key={label} className="border-t border-slate-200 pt-2"><dt className="font-medium text-slate-600">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-800">{value}</dd></div>)}</dl>}
    </AdminPanel>
    {error && <div className="mb-4"><AdminErrorState message={error} onRetry={() => void refresh()} /></div>}
    {loading && <AdminPanel className="rounded-xl"><AdminLoadingRows label="Loading case activity and messages" columns={3} rows={5} /></AdminPanel>}
    {!loading && !error && data && <div className="grid items-start gap-4 xl:grid-cols-2">
      <AdminPanel className="overflow-hidden rounded-xl"><div className="flex items-center gap-2 border-b border-slate-200 p-4"><Activity size={17} className="text-maroon" aria-hidden="true" /><div><h2 className="text-base font-semibold">Activity timeline</h2><p className="text-xs text-slate-600">Latest {data.events.length} activity records, oldest first in this batch.</p></div></div>{!events.length ? <AdminEmptyState>No activity records are available.</AdminEmptyState> : <ol className="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto">{events.map((entry) => <li key={entry.id} className="relative px-4 py-4 pl-8 before:absolute before:bottom-0 before:left-4 before:top-0 before:w-px before:bg-slate-200 first:before:top-5 last:before:bottom-5"><span aria-hidden="true" className="absolute left-[11px] top-5 h-2 w-2 rounded-full bg-maroon ring-2 ring-white" /><div className="flex flex-wrap items-center justify-between gap-2"><AdminStatusChip tone="neutral">{caseEventLabel(entry.action)}</AdminStatusChip><time className="text-xs text-slate-600">{when(entry.createdAt)}</time></div><p className="mt-2 text-xs text-slate-700">{entry.actorName || "QuestGo"}<RoleTag role={entry.role} /></p>{(entry.reason || entry.text) && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{entry.reason || entry.text}</p>}{typeof entry.amount === "number" && <p className="mt-2 font-mono text-xs tabular-nums text-slate-800">Recorded amount: {money(entry.amount)}{entry.evidence ? ` · ${entry.evidence}` : ""}</p>}</li>)}</ol>}</AdminPanel>
      <AdminPanel className="overflow-hidden rounded-xl"><div className="flex items-center gap-2 border-b border-slate-200 p-4"><MessageSquareText size={17} className="text-maroon" aria-hidden="true" /><div><h2 className="text-base font-semibold">Quest messages</h2><p className="text-xs text-slate-600">Latest {data.messages.length} messages, oldest first in this batch.</p></div></div>{!messages.length ? <AdminEmptyState>No messages are available for this case.</AdminEmptyState> : <ol className="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto">{messages.map((entry) => <li key={entry.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-900">{entry.actorName || "Unknown sender"}<RoleTag role={entry.role} /></p><time className="text-xs text-slate-600">{when(entry.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-900">{entry.text || "Empty message"}</p></li>)}</ol>}</AdminPanel>
    </div>}
  </div>;
}

export default function Page() { return <Suspense fallback={<div role="status" className="p-4 text-sm text-slate-700">Loading case review…</div>}><Review /></Suspense>; }