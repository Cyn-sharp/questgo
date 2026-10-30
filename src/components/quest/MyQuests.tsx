"use client";

import Link from "next/link";
import { useState } from "react";
import { useMyQuests, useQuestClock } from "@/hooks/useQuests";
import { getQuestExpirationMillis } from "@/lib/db/quests";
import { Card } from "@/components/ui/Card";

export function MyQuests() {
  const { user, posted, running, loading, error } = useMyQuests();
  const [section, setSection] = useState<"active" | "attention" | "history">("active");
  const [role, setRole] = useState<"posted" | "running">("posted");
  const now = useQuestClock();
  const allRecords = (role === "posted" ? posted : running).slice().sort((a, b) => (getQuestExpirationMillis(b) ?? 0) - (getQuestExpirationMillis(a) ?? 0));
  const records = allRecords.filter((quest) => {
    const expired = quest.status === "available" && (getQuestExpirationMillis(quest) ?? 0) <= now;
    const attention = quest.status === "settlement" || Boolean(quest.issueRequestedBy || quest.cancellationRequestedBy) || (Boolean(quest.completionRequestedAt) && quest.status === "in_progress") || (quest.fundingMethod === "abono" && Boolean(quest.actualExpense) && !quest.expenseApproved && !quest.committedAt && ["accepted", "in_progress"].includes(quest.status));
    return section === "attention" ? attention : section === "history" ? expired || ["completed", "cancelled", "expired"].includes(quest.status) : !expired && ["available", "accepted", "in_progress"].includes(quest.status);
  });
  const active = posted.some((quest) => ["accepted", "in_progress"].includes(quest.status) || (quest.status === "available" && (getQuestExpirationMillis(quest) ?? Infinity) > now));
  return <div className="page-container py-8">
    <div className="flex flex-wrap justify-between gap-4 mb-5"><h1 className="text-3xl text-white font-bold">My Quests</h1>{!loading && !error && user && !active && <Link href="/post-quest" className="btn-outline">Post a Quest</Link>}</div>
    <p className="text-white mb-5">One active posted quest at a time. Status changes appear here automatically.</p>
    <div className="flex gap-3 mb-5">{(["posted", "running"] as const).map((tab) => <button key={tab} type="button" aria-pressed={role === tab} onClick={() => setRole(tab)} className={role === tab ? "btn-primary" : "btn-outline"}>{tab === "posted" ? "My Requests" : "Running Quests"}</button>)}</div>
    <div className="flex flex-wrap gap-3 mb-5">{(["active", "attention", "history"] as const).map((tab) => <button key={tab} className={section === tab ? "btn-primary" : "btn-outline"} aria-pressed={section === tab} onClick={() => setSection(tab)}>{tab === "attention" ? "Needs Attention" : tab === "active" ? "Active" : "History"}</button>)}<Link href="/admin" className="text-white underline self-center">Administrator review</Link></div>
    {loading && <p className="text-white" role="status">Loading your quests…</p>}
    {error && <p className="text-white" role="alert">{error}</p>}
    {!loading && !error && !records.length && <Card className="p-6">No quests in this section.</Card>}
    <div className="grid md:grid-cols-2 gap-4">{records.map((quest) => {
      const status = quest.status === "available" && (getQuestExpirationMillis(quest) ?? 0) <= now ? "expired" : quest.status;
      return <Card key={quest.id} className="p-6 space-y-3"><span className="badge-gold capitalize">{status.replaceAll("_", " ")}</span><h2 className="text-xl font-bold">{quest.title}</h2><p>₱{quest.reward} · {quest.meetUpPoint}</p><p>{role === "posted" ? `Runner: ${quest.runnerName || "Waiting for acceptance"}` : `Requester: ${quest.requesterName || "Requester"}`}</p><Link className="btn-outline" href={`/quests/active?id=${encodeURIComponent(quest.id)}`}>Open Quest</Link></Card>;
    })}</div>
  </div>;
}
