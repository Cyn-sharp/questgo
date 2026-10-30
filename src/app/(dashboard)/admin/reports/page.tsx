"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { REPORT_REASONS, type ReportOutcome, type ReportReason } from "@/lib/quests/safety";

type Report = {
  id: string;
  questId: string;
  questTitle: string;
  reporterName: string;
  reportedId: string;
  reportedName: string;
  reason: ReportReason;
  details: string;
  createdAt: string | null;
};

const OUTCOME_LABELS: Record<ReportOutcome, string> = {
  dismissed: "Dismiss — no action needed",
  warned: "Warning recorded",
  suspended: "Suspend account (disables sign-in)",
};

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [outcomes, setOutcomes] = useState<Record<string, ReportOutcome>>({});

  useEffect(() => {
    if (!user) return;
    let current = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/reports", { headers: { Authorization: "Bearer " + await user.getIdToken() } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        if (current) { setReports(data.reports); setLoaded(true); }
      } catch (e) {
        if (current) setError(e instanceof Error ? e.message : "Unable to load reports.");
      }
    })();
    return () => { current = false; };
  }, [user]);

  async function resolve(report: Report) {
    const outcome = outcomes[report.id];
    if (busy || !user || !outcome) return;
    const warning = outcome === "suspended" ? ` This disables ${report.reportedName}'s account and signs them out everywhere.` : "";
    if (!window.confirm(`Close this report as "${OUTCOME_LABELS[outcome]}"?${warning}`)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { Authorization: "Bearer " + await user.getIdToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, outcome, note: notes[report.id] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setReports((items) => items.filter((item) => item.id !== report.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to resolve report.");
    } finally {
      setBusy(false);
    }
  }

  // Repeat reports against one person are the strongest signal for reviewers.
  const countByUser = reports.reduce<Record<string, number>>((counts, report) => {
    counts[report.reportedId] = (counts[report.reportedId] || 0) + 1;
    return counts;
  }, {});

  return (
    <div className="page-container py-8 space-y-4">
      <Link href="/admin" className="text-white underline">Settlement queue</Link>
      <h1 className="text-3xl font-bold text-white">User reports</h1>
      <p className="text-white">Administrator accounts only. Check the quest&apos;s activity and conversation before deciding. Latest batch: up to 100 open reports.</p>
      {error && <p role="alert" className="rounded bg-white p-4 text-red-700">{error}</p>}
      {loaded && !reports.length && <p className="text-white">No open reports.</p>}
      {reports.map((report) => (
        <section key={report.id} className="rounded-xl bg-white p-6 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="text-xl font-bold">{REPORT_REASONS[report.reason] ?? report.reason}</h2>
            <time className="text-sm text-gray-600">{report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}</time>
          </div>
          <p>
            <strong>{report.reporterName}</strong> reported <strong>{report.reportedName}</strong>
            {countByUser[report.reportedId] > 1 && <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-sm text-red-800">{countByUser[report.reportedId]} open reports</span>}
          </p>
          <p className="text-sm">Quest: {report.questTitle || report.questId}</p>
          <p className="whitespace-pre-wrap rounded bg-gray-50 p-3">{report.details}</p>
          <Link className="underline" href={"/admin/review?id=" + encodeURIComponent(report.questId)}>Inspect activity &amp; conversation</Link>
          <fieldset className="space-y-1">
            <legend className="font-semibold">Outcome</legend>
            {(Object.keys(OUTCOME_LABELS) as ReportOutcome[]).map((outcome) => (
              <label key={outcome} className="flex gap-2">
                <input type="radio" name={"outcome-" + report.id} checked={outcomes[report.id] === outcome} onChange={() => setOutcomes((current) => ({ ...current, [report.id]: outcome }))} />
                {OUTCOME_LABELS[outcome]}
              </label>
            ))}
          </fieldset>
          <label className="block">Decision notes
            <textarea className="block w-full rounded border p-3" maxLength={2000} value={notes[report.id] || ""} onChange={(e) => setNotes((current) => ({ ...current, [report.id]: e.target.value }))} />
          </label>
          <button className="btn-primary" disabled={busy || !outcomes[report.id] || (notes[report.id]?.trim().length ?? 0) < 10} onClick={() => resolve(report)}>
            Record Decision &amp; Close Report
          </button>
        </section>
      ))}
    </div>
  );
}
