"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRunnerStatus } from "@/hooks/useRunnerStatus";
import { RunnerApplyView, type ApplicationPayload } from "@/components/runner/RunnerApplyView";

export default function RunnerApplyPage() {
  const { user } = useAuth();
  const { status, reviewNote, submittedAt, refresh } = useRunnerStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(payload: ApplicationPayload) {
    if (!user || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/runner", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await user.getIdToken()) },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to submit your application.");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit your application.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <div className="page-container py-8"><p className="text-parchment/80">Loading…</p></div>;
  if (status === "error") return <div className="page-container py-8"><p role="alert" className="rounded-xl bg-white p-4 text-sm text-red-700">We couldn&apos;t load your application. Refresh and try again.</p></div>;
  return <RunnerApplyView status={status} reviewNote={reviewNote} submittedAt={submittedAt} busy={busy} error={error} onSubmit={submit} />;
}
