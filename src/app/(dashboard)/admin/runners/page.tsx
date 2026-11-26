"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";

type Application = { uid: string; name: string; email: string; availability: string; termsVersion: string; createdAt: string | null };

export default function RunnerApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function call(method: "GET" | "POST", body?: unknown) {
    if (!user) throw new Error("Sign in as an administrator.");
    const response = await fetch("/api/admin/runners", {
      method,
      headers: { Authorization: "Bearer " + (await user.getIdToken()), "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  }

  useEffect(() => {
    let current = true;
    if (!user) return;
    void (async () => {
      try {
        const data = await call("GET");
        if (current) { setApplications(data.applications); setLoaded(true); }
      } catch (e) {
        if (current) setError(e instanceof Error ? e.message : "Unable to load applications.");
      }
    })();
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function decide(uid: string, outcome: "approve" | "reject") {
    if (busy) return;
    setBusy(uid);
    setError("");
    try {
      await call("POST", { uid, outcome, note: notes[uid] ?? "" });
      setApplications((items) => items.filter((item) => item.uid !== uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record the decision.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="page-container py-8">
      <PageHeader eyebrow="Administration" title="Runner applications" description="Approve applicants who completed the self-declaration and accepted the Runner Terms. A reason is required to decline." actions={<Link href="/admin" className="btn-outline">Back to resolution queue</Link>} />
      {error && <p role="alert" className="mb-4 rounded-xl bg-white p-4 text-sm text-red-700">{error}</p>}
      {loaded && !applications.length && <p className="text-parchment">No pending applications.</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {applications.map((application) => (
          <li key={application.uid} className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
            <div>
              <h2 className="text-lg font-bold text-dark">{application.name}</h2>
              <p className="text-sm text-muted">{application.email}</p>
              {application.createdAt && <p className="text-xs text-muted">Applied {new Date(application.createdAt).toLocaleString()} · Terms {application.termsVersion}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Availability</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-dark">{application.availability}</p>
            </div>
            <p className="text-sm text-muted">All health and fitness statements were confirmed and consent was given.</p>
            <label className="block text-sm font-semibold text-dark">
              Note (required to decline)
              <textarea value={notes[application.uid] ?? ""} maxLength={500} rows={2}
                onChange={(e) => setNotes((current) => ({ ...current, [application.uid]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-field bg-white px-3 py-2 text-sm font-normal text-dark" />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" disabled={busy === application.uid} onClick={() => decide(application.uid, "approve")}>Approve runner</button>
              <button type="button" className="btn-outline" disabled={busy === application.uid || (notes[application.uid] ?? "").trim().length < 5} onClick={() => decide(application.uid, "reject")}>Decline</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
