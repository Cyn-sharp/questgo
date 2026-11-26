"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatAge } from "@/lib/admin/presentation";
import { AUDIT_FILTERS, auditCategory, auditTarget, describeAuditAction, type AuditFilter } from "@/lib/admin/audit-labels";
import { AdminEmptyState, AdminErrorState, AdminLoadingRows, AdminPageHeading, AdminPanel, AdminStatusChip } from "@/components/admin/ConsoleUI";

type Entry = { id: string; actorName: string; action: string; targetType: string; targetId: string; details: string; createdAt: string | null };

const phTime = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : "Could not load the audit log.");

export default function AdminAuditPage() {
  const { user, isLoading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<AuditFilter>("all");

  const fetchEntries = useCallback(async () => {
    if (!user) throw new Error("Sign in as an administrator.");
    const response = await fetch("/api/admin/audit", { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Could not load the audit log.");
    if (!Array.isArray(data.entries)) throw new Error("Unexpected audit log response.");
    return data.entries as Entry[];
  }, [user]);

  useEffect(() => {
    if (isLoading) return;
    let current = true;
    void fetchEntries().then(
      (items) => { if (current) { setEntries(items); setStatus("ready"); } },
      (problem) => { if (current) { setError(errorText(problem)); setStatus("error"); } },
    );
    return () => { current = false; };
  }, [isLoading, fetchEntries]);

  async function refresh() {
    setStatus("loading");
    setError("");
    try {
      setEntries(await fetchEntries());
      setStatus("ready");
    } catch (problem) {
      setError(errorText(problem));
      setStatus("error");
    }
  }

  const counts = useMemo(() => {
    const totals: Record<string, number> = { all: entries.length };
    for (const entry of entries) {
      const category = auditCategory(entry.action);
      totals[category] = (totals[category] ?? 0) + 1;
    }
    return totals;
  }, [entries]);
  const visible = useMemo(() => (filter === "all" ? entries : entries.filter((entry) => auditCategory(entry.action) === filter)), [entries, filter]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <AdminPageHeading
        eyebrow="Records"
        title="Audit log"
        description="The latest 100 administrator decisions, newest first. Entries can't be edited or deleted from the app."
        action={
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={status === "loading"}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:opacity-50"
          >
            <RefreshCw size={15} aria-hidden="true" /> Refresh
          </button>
        }
      />

      {status === "error" ? <AdminErrorState message={error} onRetry={() => void refresh()} /> : null}
      {status === "loading" ? <AdminPanel className="rounded-xl"><AdminLoadingRows label="Loading the audit log" rows={5} columns={3} /></AdminPanel> : null}

      {status === "ready" ? (
        <>
          <div role="group" aria-label="Show decisions of type" className="mb-4 flex flex-wrap gap-2">
            {AUDIT_FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.id)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon ${active ? "border-maroon bg-maroon text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}
                >
                  {option.label}
                  <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{counts[option.id] ?? 0}</span>
                </button>
              );
            })}
          </div>

          {!visible.length ? (
            <AdminEmptyState>{entries.length ? "No decisions of this type yet." : "No administrator decisions recorded yet."}</AdminEmptyState>
          ) : (
            <AdminPanel className="overflow-hidden rounded-xl">
              <ul className="divide-y divide-slate-100">
                {visible.map((entry) => {
                  const action = describeAuditAction(entry.action);
                  return (
                    <li key={entry.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0">
                        <AdminStatusChip tone={action.tone}>{action.label}</AdminStatusChip>
                        {entry.details ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">{entry.details}</p> : null}
                        <p className="mt-1 text-xs text-slate-600">
                          By {entry.actorName || "Administrator"} · <span title={entry.targetId}>{auditTarget(entry.targetType, entry.targetId)}</span>
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-slate-600 sm:text-right">
                        {entry.createdAt ? (
                          <>
                            <time dateTime={entry.createdAt}>{phTime.format(new Date(entry.createdAt))}</time>
                            <span className="block">{formatAge(entry.createdAt)}</span>
                          </>
                        ) : "Time unknown"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </AdminPanel>
          )}
        </>
      ) : null}
    </div>
  );
}