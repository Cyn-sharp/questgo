"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Banknote, Search, ShieldAlert, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { money } from "@/lib/quests/funding";
import { filterCases, formatAge, repeatReportCounts, sortByAge, sortByAmount, type AdminCaseRow } from "@/lib/admin/presentation";
import { AdminEmptyState, AdminErrorState, AdminLoadingRows, AdminPageHeading, AdminPanel, AdminStatusChip, AdminTableFrame, adminInput, adminTd, adminTh } from "@/components/admin/ConsoleUI";

type Case = AdminCaseRow & { issueReason: string; requesterName: string; runnerName: string; actualExpense: number; expenseEvidence: string; expenseApproved: boolean; fundingMethod: string; reward: number };

function Initial({ name }: { name?: string }) { return <span aria-hidden="true" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">{name?.trim().slice(0, 1).toUpperCase() || "?"}</span>; }

export default function AdminPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false), [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({}), [checked, setChecked] = useState<Record<string, boolean>>({});
  const [overview, setOverview] = useState<{ reports: number; repeatReporters: number }>();
  const [search, setSearch] = useState(""), [funding, setFunding] = useState("all"), [sort, setSort] = useState("newest");

  const loadCases = useCallback(async () => {
    if (!user) throw new Error("Sign in as an administrator.");
    const response = await fetch("/api/admin/quests", { headers: { Authorization: "Bearer " + await user.getIdToken() }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load settlement cases.");
    if (!Array.isArray(data.quests)) throw new Error("Unexpected settlement queue response.");
    return data.quests as Case[];
  }, [user]);

  const loadQueue = useCallback(async () => {
    const [caseRows, token] = await Promise.all([loadCases(), user?.getIdToken()]);
    if (!token) throw new Error("Sign in as an administrator.");
    const response = await fetch("/api/admin/reports", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load user reports.");
    if (!Array.isArray(data.reports)) throw new Error("Unexpected report queue response.");
    const counts = repeatReportCounts(data.reports);
    return { caseRows, reports: data.reports.length, repeatReporters: Object.values(counts).filter((count) => count > 1).length };
  }, [loadCases, user]);
  useEffect(() => {
    let current = true;
    void loadQueue().then((result) => { if (current) { setCases(result.caseRows); setOverview({ reports: result.reports, repeatReporters: result.repeatReporters }); setLoaded(true); } })
      .catch((e) => { if (current) setError(e instanceof Error ? e.message : "Unable to load admin queues."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [loadQueue]);
  async function refreshQueue() {
    setLoading(true); setError("");
    try { const result = await loadQueue(); setCases(result.caseRows); setOverview({ reports: result.reports, repeatReporters: result.repeatReporters }); setLoaded(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load admin queues."); }
    finally { setLoading(false); }
  }

  const visible = useMemo(() => {
    const filtered = filterCases(cases, search, funding);
    if (sort === "amount-high") return sortByAmount(filtered, "high");
    if (sort === "amount-low") return sortByAmount(filtered, "low");
    return sortByAge(filtered, sort === "oldest" ? "oldest" : "newest");
  }, [cases, search, funding, sort]);

  async function resolve(id: string) {
    if (busy || !user || !window.confirm("Close this case with your recorded settlement decision?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/quests", { method: "POST", headers: { Authorization: "Bearer " + await user.getIdToken(), "Content-Type": "application/json" }, body: JSON.stringify({ id, note: notes[id], settlementVerified: checked[id] }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to resolve case.");
      setCases((items) => items.filter((item) => item.id !== id));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to resolve case."); }
    finally { setBusy(false); }
  }

  function decisionForm(item: Case, suffix: string) {
    return <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left" onClick={(event) => event.stopPropagation()}>
      <p className="text-xs text-slate-700">Closing records your review and moves this case out of the open settlement queue. It does not verify or process a payment.</p>
      <p className="mt-2 text-xs font-medium text-slate-700">Required: a decision note of at least 10 characters and confirmation that obligations were reviewed.</p>
      <label htmlFor={`case-note-${suffix}`} className="mt-3 block text-xs font-semibold">Decision note</label>
      <textarea id={`case-note-${suffix}`} className={`${adminInput} mt-1 min-h-20 py-2`} maxLength={2000} value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} />
      <label className="mt-3 flex min-h-11 items-center gap-2 text-xs text-slate-800"><input type="checkbox" checked={checked[item.id] || false} onChange={(event) => setChecked((current) => ({ ...current, [item.id]: event.target.checked }))} />I reviewed and resolved the outstanding obligations.</label>
      <button type="button" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-maroon px-3 text-xs font-semibold text-white transition hover:bg-maroon-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:opacity-50 motion-reduce:transition-none" disabled={busy || !checked[item.id] || (notes[item.id]?.trim().length ?? 0) < 10} onClick={() => void resolve(item.id)}>Close settlement case</button>
    </div>;
  }

  const searchAndFilters = <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_12rem_12rem]"><label className="relative"><span className="sr-only">Search title, participants, or reason</span><Search size={16} aria-hidden="true" className="absolute left-3 top-3.5 text-slate-500" /><input className={`${adminInput} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cases or people" /></label><label className="text-xs font-medium text-slate-700">Funding method<select className={`${adminInput} mt-1`} value={funding} onChange={(event) => setFunding(event.target.value)}><option value="all">All methods</option>{Array.from(new Set(cases.map((item) => item.fundingMethod))).map((method) => <option key={method} value={method}>{method}</option>)}</select></label><label className="text-xs font-medium text-slate-700">Sort by<select className={`${adminInput} mt-1`} value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount-high">Expense: high to low</option><option value="amount-low">Expense: low to high</option></select></label></div>;

  return <div className="mx-auto max-w-[1500px]">
    <AdminPageHeading eyebrow="Case management" title="Settlement queue" description="Review unresolved payment, expense, or handover cases. Decisions are recorded for the case history." />
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AdminPanel className="rounded-xl p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Open settlements</p><p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-maroon">{loading ? "—" : cases.length === 100 ? "100+" : cases.length}</p></div><span className="rounded-lg bg-rose-50 p-2 text-maroon"><Banknote size={18} aria-hidden="true" /></span></div></AdminPanel>
      <AdminPanel className="rounded-xl p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Open reports</p><p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-maroon">{loading ? "—" : overview?.reports === 100 ? "100+" : overview?.reports ?? "—"}</p></div><span className="rounded-lg bg-rose-50 p-2 text-maroon"><ShieldAlert size={18} aria-hidden="true" /></span></div></AdminPanel>
      <AdminPanel className="rounded-xl p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Oldest open item</p><p className="mt-2 text-sm font-semibold text-slate-700">{loading ? "Loading" : "Age unavailable"}</p></div><span className="rounded-lg bg-slate-100 p-2 text-slate-700"><Activity size={18} aria-hidden="true" /></span></div></AdminPanel>
      <AdminPanel className="rounded-xl p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Users with repeat reports</p><p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-maroon">{loading ? "—" : overview?.repeatReporters ?? 0}</p><Link href="/admin/reports" className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-maroon hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">View flagged reports <ArrowRight size={14} aria-hidden="true" /></Link></div><span className="rounded-lg bg-slate-100 p-2 text-slate-700"><Users size={18} aria-hidden="true" /></span></div></AdminPanel>
    </div>
    <div className="mb-5 grid gap-4 lg:grid-cols-2"><AdminPanel className="rounded-xl p-4"><h2 className="text-sm font-semibold">Needs attention</h2><p className="mt-1 text-sm text-slate-700">{cases.length ? `${cases.length}${cases.length === 100 ? "+" : ""} settlement case(s) awaiting review.` : loading ? "Checking open cases…" : "No settlement cases are waiting for review."}</p><Link href="#settlement-cases" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-maroon hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">Go to settlement cases <ArrowRight size={14} className="ml-1" aria-hidden="true" /></Link></AdminPanel><AdminPanel className="rounded-xl p-4"><h2 className="text-sm font-semibold">Report queue</h2><p className="mt-1 text-sm text-slate-700">{loading ? "Checking open reports…" : overview?.reports ? `${overview.reports}${overview.reports === 100 ? "+" : ""} report(s) awaiting review.` : "No reports are waiting for review."}</p><Link href="/admin/reports" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-maroon hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">Open user reports <ArrowRight size={14} className="ml-1" aria-hidden="true" /></Link></AdminPanel></div>
    {error && <div className="mb-4"><AdminErrorState message={error} onRetry={() => void refreshQueue()} /></div>}
    <AdminPanel id="settlement-cases" className="overflow-hidden rounded-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 p-4"><div><h2 className="text-base font-semibold">Open settlement cases</h2><p className="mt-1 text-xs text-slate-600">Latest batch: up to 100 cases.</p></div><p role="status" aria-live="polite" className="text-xs font-medium text-slate-700">{loading ? "Loading cases" : `${visible.length} of ${cases.length} cases`}</p></div>
      {searchAndFilters}
      {loading && <AdminLoadingRows label="Loading settlement cases" columns={6} />}
      {!loading && loaded && !visible.length && <AdminEmptyState>No open cases. Nothing needs review.</AdminEmptyState>}
      {!loading && visible.length > 0 && <>
        <AdminTableFrame caption="Open settlement cases"><thead><tr>{["Quest / reason", "Participants", "Recorded amount", "Funding", "Age", "Status", "Review"].map((title) => <th key={title} scope="col" className={adminTh}>{title}</th>)}</tr></thead><tbody>{visible.map((item) => <tr key={item.id} className="transition-colors hover:bg-slate-50 focus-within:bg-rose-50 motion-reduce:transition-none"><td className={adminTd}><Link href={`/admin/review?id=${encodeURIComponent(item.id)}`} className="font-semibold text-slate-950 hover:text-maroon hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">{item.title || "Untitled quest"}</Link><p className="mt-1 max-w-xs text-xs text-slate-600">{item.issueReason}</p></td><td className={adminTd}><div className="flex items-center gap-2"><Initial name={item.requesterName} /><span>{item.requesterName || "Requester"}</span></div><div className="mt-2 flex items-center gap-2"><Initial name={item.runnerName} /><span>{item.runnerName || "Runner"}</span></div></td><td className={`${adminTd} font-mono tabular-nums`}>{money(item.actualExpense)}<p className="text-xs font-sans text-slate-600">Reward {money(item.reward)}</p></td><td className={adminTd}>{item.fundingMethod}</td><td className={adminTd}>{formatAge(item.createdAt)}</td><td className={adminTd}><AdminStatusChip tone="warning">Open</AdminStatusChip>{item.actualExpense > 0 && !item.expenseEvidence && <div className="mt-1"><AdminStatusChip tone="danger">Needs evidence</AdminStatusChip></div>}</td><td className={adminTd}><details><summary className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-xs font-semibold text-maroon hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">Review decision</summary>{decisionForm(item, item.id + "-desktop")}</details></td></tr>)}</tbody></AdminTableFrame>
        <div className="space-y-3 p-3 lg:hidden">{visible.map((item) => <AdminPanel key={item.id} className="rounded-xl p-4"><div className="flex items-start justify-between gap-2"><div><Link href={`/admin/review?id=${encodeURIComponent(item.id)}`} className="font-semibold text-slate-950 underline decoration-slate-400 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">{item.title || "Untitled quest"}</Link><p className="mt-1 text-xs text-slate-600">{item.issueReason}</p></div><AdminStatusChip tone="warning">Open</AdminStatusChip></div><dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-600">Requester</dt><dd className="mt-1 flex items-center gap-2"><Initial name={item.requesterName} />{item.requesterName || "—"}</dd></div><div><dt className="text-slate-600">Runner</dt><dd className="mt-1 flex items-center gap-2"><Initial name={item.runnerName} />{item.runnerName || "—"}</dd></div><div><dt className="text-slate-600">Recorded amount</dt><dd className="mt-1 font-mono tabular-nums">{money(item.actualExpense)}</dd></div><div><dt className="text-slate-600">Funding</dt><dd className="mt-1">{item.fundingMethod}</dd></div><div><dt className="text-slate-600">Age</dt><dd className="mt-1">{formatAge(item.createdAt)}</dd></div></dl>{item.actualExpense > 0 && !item.expenseEvidence && <div className="mt-2"><AdminStatusChip tone="danger">Needs evidence</AdminStatusChip></div>}<details className="mt-2"><summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-maroon focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">Review decision</summary>{decisionForm(item, item.id + "-mobile")}</details></AdminPanel>)}</div>
      </>}
    </AdminPanel>
  </div>;
}
