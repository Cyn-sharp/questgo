"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { filterReports, formatAge, repeatReportCounts, sortByAge, type AdminReportRow } from "@/lib/admin/presentation";
import { REPORT_REASONS, type ReportOutcome, type ReportReason } from "@/lib/quests/safety";
import { AdminEmptyState, AdminErrorState, AdminLoadingRows, AdminPageHeading, AdminPanel, AdminStatusChip, AdminTableFrame, adminInput, adminTd, adminTh } from "@/components/admin/ConsoleUI";

type Report = AdminReportRow & { reporterName: string; reportedId: string; reportedName: string; reason: ReportReason; details: string; createdAt: string | null };
const OUTCOME_LABELS: Record<ReportOutcome, string> = { dismissed: "Dismiss — no action needed", warned: "Warning recorded", suspended: "Suspend account (disables sign-in)" };

function Initial({ name }: { name?: string }) { return <span aria-hidden="true" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">{name?.trim().slice(0, 1).toUpperCase() || "?"}</span>; }

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]), [loaded, setLoaded] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({}), [outcomes, setOutcomes] = useState<Record<string, ReportOutcome>>({});
  const [search, setSearch] = useState(""), [outcomeFilter, setOutcomeFilter] = useState("all"), [sort, setSort] = useState<"oldest" | "newest">("newest");

  const loadReports = useCallback(async () => {
    if (!user) throw new Error("Sign in as an administrator.");
    const response = await fetch("/api/admin/reports", { headers: { Authorization: "Bearer " + await user.getIdToken() }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load reports.");
    if (!Array.isArray(data.reports)) throw new Error("Unexpected report queue response.");
    return data.reports as Report[];
  }, [user]);
  useEffect(() => {
    let current = true;
    void loadReports().then((items) => { if (current) { setReports(items); setLoaded(true); } })
      .catch((e) => { if (current) setError(e instanceof Error ? e.message : "Unable to load reports."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [loadReports]);
  async function refresh() {
    setLoading(true); setError("");
    try { setReports(await loadReports()); setLoaded(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load reports."); }
    finally { setLoading(false); }
  }

  const countByUser = useMemo(() => repeatReportCounts(reports), [reports]);
  const visible = useMemo(() => sortByAge(filterReports(reports, search, outcomeFilter, outcomes), sort), [reports, search, outcomeFilter, outcomes, sort]);

  async function resolve(report: Report) {
    const outcome = outcomes[report.id];
    if (busy || !user || !outcome) return;
    const warning = outcome === "suspended" ? ` This disables ${report.reportedName}'s account and signs them out everywhere.` : "";
    if (!window.confirm(`Close this report as "${OUTCOME_LABELS[outcome]}"?${warning}`)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/reports", { method: "POST", headers: { Authorization: "Bearer " + await user.getIdToken(), "Content-Type": "application/json" }, body: JSON.stringify({ id: report.id, outcome, note: notes[report.id] }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to resolve report.");
      setReports((items) => items.filter((item) => item.id !== report.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to resolve report."); }
    finally { setBusy(false); }
  }

  function decisionForm(report: Report, suffix: string) {
    return <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-700">Closing records your review outcome. Suspending disables account sign-in and ends active sessions.</p>
      <p className="text-xs font-medium text-slate-700">Required: choose an outcome and provide a note of at least 10 characters.</p>
      <fieldset><legend className="text-xs font-semibold text-slate-800">Decision outcome</legend><div className="mt-1 space-y-1">{(Object.keys(OUTCOME_LABELS) as ReportOutcome[]).map((outcome) => <label key={outcome} className="flex min-h-11 items-center gap-2 text-xs text-slate-800"><input type="radio" name={`outcome-${suffix}`} checked={outcomes[report.id] === outcome} onChange={() => setOutcomes((current) => ({ ...current, [report.id]: outcome }))} />{OUTCOME_LABELS[outcome]}</label>)}</div></fieldset>
      <label htmlFor={`report-note-${suffix}`} className="block text-xs font-semibold text-slate-800">Decision notes</label><textarea id={`report-note-${suffix}`} className={`${adminInput} min-h-20 py-2`} maxLength={2000} value={notes[report.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} />
      <button type="button" className="inline-flex min-h-11 items-center rounded-lg bg-maroon px-3 text-xs font-semibold text-white transition hover:bg-maroon-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:opacity-50 motion-reduce:transition-none" disabled={busy || !outcomes[report.id] || (notes[report.id]?.trim().length ?? 0) < 10} onClick={() => void resolve(report)}>Record decision &amp; close report</button>
    </div>;
  }

  return <div className="mx-auto max-w-[1500px]">
    <AdminPageHeading eyebrow="Safety review" title="User reports" description="Review reports and supporting context. Confirm the quest activity and conversation before recording an outcome." action={<span className="inline-flex items-center gap-2 rounded-full border border-amber-700 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950"><ShieldAlert size={15} aria-hidden="true" />Open report queue</span>} />
    {error && <div className="mb-4"><AdminErrorState message={error} onRetry={() => void refresh()} /></div>}
    <AdminPanel className="overflow-hidden rounded-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 p-4"><div><h2 className="text-base font-semibold">Open reports</h2><p className="mt-1 text-xs text-slate-600">Latest batch: up to 100 open reports.</p></div><p role="status" aria-live="polite" className="text-xs font-medium text-slate-700">{loading ? "Loading reports" : `${visible.length} of ${reports.length} reports`}</p></div>
      <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_12rem_12rem]"><label className="relative"><span className="sr-only">Search quest, participants, reason, or details</span><Search size={16} aria-hidden="true" className="absolute left-3 top-3.5 text-slate-500" /><input className={`${adminInput} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports or people" /></label><label className="text-xs font-medium text-slate-700">Decision filter<select className={`${adminInput} mt-1`} value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value)}><option value="all">All open reports</option><option value="unassigned">Outcome not selected</option>{(Object.keys(OUTCOME_LABELS) as ReportOutcome[]).map((outcome) => <option key={outcome} value={outcome}>{OUTCOME_LABELS[outcome]}</option>)}</select></label><label className="text-xs font-medium text-slate-700">Sort by age<select className={`${adminInput} mt-1`} value={sort} onChange={(event) => setSort(event.target.value as "oldest" | "newest")}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
      {loading && <AdminLoadingRows label="Loading user reports" columns={6} />}
      {!loading && loaded && !visible.length && <AdminEmptyState>No open reports. Nothing needs review.</AdminEmptyState>}
      {!loading && visible.length > 0 && <>
        <AdminTableFrame caption="Open user reports"><thead><tr>{["Quest / reason", "Reporter", "Reported user", "Details", "Age / status", "Review decision"].map((title) => <th key={title} scope="col" className={adminTh}>{title}</th>)}</tr></thead><tbody>{visible.map((report) => <tr key={report.id} className="transition-colors hover:bg-slate-50 focus-within:bg-rose-50 motion-reduce:transition-none"><td className={adminTd}><Link href={`/admin/review?id=${encodeURIComponent(report.questId)}`} className="font-semibold text-slate-950 hover:text-maroon hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">{report.questTitle || report.questId}</Link><p className="mt-1 text-xs text-slate-600">{REPORT_REASONS[report.reason] ?? report.reason}</p></td><td className={adminTd}><span className="flex items-center gap-2"><Initial name={report.reporterName} />{report.reporterName}</span></td><td className={adminTd}><span className="flex items-center gap-2"><Initial name={report.reportedName} />{report.reportedName}</span>{countByUser[report.reportedId] > 1 && <div className="mt-2"><AdminStatusChip tone="danger">Repeatedly reported · {countByUser[report.reportedId]} open</AdminStatusChip></div>}</td><td className={`${adminTd} max-w-xs whitespace-pre-wrap text-xs`}>{report.details}</td><td className={adminTd}><p>{formatAge(report.createdAt)}</p><div className="mt-1"><AdminStatusChip tone="warning">Open</AdminStatusChip></div></td><td className={adminTd}><Link className="inline-flex min-h-11 items-center text-xs font-semibold text-maroon hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon" href={`/admin/review?id=${encodeURIComponent(report.questId)}`}>Inspect case</Link><details><summary className="inline-flex min-h-11 cursor-pointer items-center text-xs font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">Record decision</summary>{decisionForm(report, report.id + "-desktop")}</details></td></tr>)}</tbody></AdminTableFrame>
        <div className="space-y-3 p-3 lg:hidden">{visible.map((report) => <AdminPanel key={report.id} className="rounded-xl p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><Link href={`/admin/review?id=${encodeURIComponent(report.questId)}`} className="font-semibold text-slate-950 underline decoration-slate-400 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">{report.questTitle || report.questId}</Link><p className="mt-1 text-xs text-slate-600">{REPORT_REASONS[report.reason] ?? report.reason}</p></div><AdminStatusChip tone="warning">Open</AdminStatusChip></div><dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="text-slate-600">Reporter</dt><dd className="mt-1 flex items-center gap-2"><Initial name={report.reporterName} />{report.reporterName}</dd></div><div><dt className="text-slate-600">Reported user</dt><dd className="mt-1 flex items-center gap-2"><Initial name={report.reportedName} />{report.reportedName}</dd></div><div><dt className="text-slate-600">Reported details</dt><dd className="mt-1 whitespace-pre-wrap">{report.details}</dd></div><div><dt className="text-slate-600">Age</dt><dd className="mt-1">{formatAge(report.createdAt)}</dd></div></dl>{countByUser[report.reportedId] > 1 && <div className="mt-2"><AdminStatusChip tone="danger">Repeatedly reported · {countByUser[report.reportedId]} open</AdminStatusChip></div>}<Link className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-maroon hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon" href={`/admin/review?id=${encodeURIComponent(report.questId)}`}>Inspect activity &amp; conversation</Link><details><summary className="inline-flex min-h-11 cursor-pointer items-center text-xs font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon">Record decision</summary>{decisionForm(report, report.id + "-mobile")}</details></AdminPanel>)}</div>
      </>}
    </AdminPanel>
  </div>;
}
