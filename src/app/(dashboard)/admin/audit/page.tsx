"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

type Entry = { id: string; actorName: string; action: string; targetType: string; targetId: string; details: string; createdAt: string | null };

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/audit", { headers: { Authorization: "Bearer " + await user.getIdToken() } });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "Could not load the audit log.");
        if (active) setEntries(body.entries);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Could not load the audit log."); }
    })();
    return () => { active = false; };
  }, [user]);

  return (
    <div className="page-container space-y-4 py-8">
      <div className="flex gap-4 text-white underline"><Link href="/admin">Quest resolution</Link><Link href="/admin/reports">User reports</Link></div>
      <h1 className="text-3xl font-bold text-white">Audit log</h1>
      <p className="text-parchment/80">The latest 100 administrator decisions. Entries can&apos;t be edited or deleted from the app.</p>
      {error && <p role="alert" className="rounded-xl bg-white p-4 text-red-700">{error}</p>}
      {!entries && !error && <p className="text-white">Loading…</p>}
      {entries && !entries.length && <p className="rounded-xl bg-white p-4">No administrator actions recorded yet.</p>}
      <ul className="space-y-3">
        {entries?.map((entry) => (
          <li key={entry.id} className="rounded-xl bg-white p-4 text-[#161414]">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-bold">{entry.action}</p>
              <time className="text-sm text-stone-600">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}</time>
            </div>
            <p className="text-sm">By {entry.actorName} · {entry.targetType} <span className="break-all">{entry.targetId}</span></p>
            {entry.details && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-700">{entry.details}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
