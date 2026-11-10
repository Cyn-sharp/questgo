"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, MapPin, ShieldCheck, User } from "lucide-react";
import { useMyQuests, useQuestClock } from "@/hooks/useQuests";
import { getQuestExpirationMillis } from "@/lib/db/quests";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "./StatusBadge";
import type { Quest } from "@/types/quest";

type Section = "active" | "attention" | "history";

const EMPTY: Record<Section, { title: string; description: string }> = {
  active: { title: "Nothing active right now", description: "Quests you post or accept show up here while they're underway." },
  attention: { title: "You're all caught up", description: "Quests that need a decision from you, like a cost to approve or a cancellation request, appear here." },
  history: { title: "No past quests yet", description: "Completed, cancelled and expired quests are kept here for reference." },
};

export function MyQuests() {
  const { user, posted, running, loading, error } = useMyQuests();
  const [section, setSection] = useState<Section>("active");
  const [role, setRole] = useState<"posted" | "running">("posted");
  const [isAdmin, setIsAdmin] = useState(false);
  const now = useQuestClock();

  useEffect(() => {
    if (!user) return;
    let current = true;
    user.getIdTokenResult().then((token) => { if (current) setIsAdmin(token.claims.admin === true); }).catch(() => undefined);
    return () => { current = false; };
  }, [user]);

  const expired = (quest: Quest) => quest.status === "available" && (getQuestExpirationMillis(quest) ?? 0) <= now;
  const inSection = (quest: Quest, which: Section) => {
    if (which === "history") return expired(quest) || ["completed", "cancelled", "expired"].includes(quest.status);
    if (which === "attention") {
      return quest.status === "settlement" || Boolean(quest.issueRequestedBy || quest.cancellationRequestedBy)
        || (Boolean(quest.completionRequestedAt) && quest.status === "in_progress")
        || (quest.fundingMethod === "abono" && Boolean(quest.actualExpense) && !quest.expenseApproved && !quest.committedAt && ["accepted", "in_progress"].includes(quest.status));
    }
    return !expired(quest) && ["available", "accepted", "in_progress"].includes(quest.status);
  };

  const all = (role === "posted" ? posted : running).slice().sort((a, b) => (getQuestExpirationMillis(b) ?? 0) - (getQuestExpirationMillis(a) ?? 0));
  const records = all.filter((quest) => inSection(quest, section));
  const count = (which: Section) => all.filter((quest) => inSection(quest, which)).length;
  const canPost = !posted.some((quest) => ["accepted", "in_progress"].includes(quest.status) || (quest.status === "available" && !expired(quest)));

  return (
    <div className="page-container py-8 sm:py-10">
      <PageHeader
        eyebrow="Your activity"
        title="My Quests"
        description="Everything you've posted or are running. You can have one active posted quest at a time, and status changes appear here automatically."
        actions={!loading && !error && user && canPost ? <Link href="/post-quest" className="btn-primary !py-2.5">Post a Quest</Link> : null}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Your role"
          value={role}
          onChange={setRole}
          options={[{ value: "posted", label: "My Requests", count: posted.length }, { value: "running", label: "Running Quests", count: running.length }]}
        />
        <SegmentedControl
          label="Quest status"
          value={section}
          onChange={setSection}
          options={[
            { value: "active", label: "Active", count: count("active") },
            { value: "attention", label: "Needs Attention", count: count("attention") },
            { value: "history", label: "History", count: count("history") },
          ]}
        />
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Loading your quests">
          {[0, 1].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/10" />)}
        </div>
      )}
      {error && <p role="alert" className="rounded-2xl bg-white p-4 text-sm font-medium text-red-700">{error}</p>}
      {!loading && !error && !records.length && (
        <EmptyState
          icon={ClipboardList}
          {...EMPTY[section]}
          action={section === "active" && role === "posted" && canPost ? <Link href="/post-quest" className="btn-primary !py-2.5">Post a Quest</Link>
            : section === "active" && role === "running" ? <Link href="/quests" className="btn-primary !py-2.5">Find a Quest</Link> : null}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {!loading && records.map((quest) => (
          <article key={quest.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <StatusBadge status={expired(quest) ? "expired" : quest.status} />
              <span className="font-display text-xl font-bold text-maroon tabular-nums">₱{quest.reward.toLocaleString()}</span>
            </div>
            <h2 className="font-display text-lg font-semibold leading-snug text-dark">{quest.title}</h2>
            <dl className="grid gap-1.5 text-sm text-muted">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-maroon/70" aria-hidden /><dt className="sr-only">Meet-up</dt><dd className="truncate">{quest.meetUpPoint}</dd></div>
              <div className="flex items-center gap-2"><User className="h-4 w-4 shrink-0 text-maroon/70" aria-hidden /><dt className="sr-only">{role === "posted" ? "Runner" : "Requester"}</dt>
                <dd className="truncate">{role === "posted" ? quest.runnerName || "Waiting for a runner" : `Requested by ${quest.requesterName || "a student"}`}</dd></div>
            </dl>
            <Link href={`/quests/active?id=${encodeURIComponent(quest.id)}`} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-maroon px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-maroon-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              Open quest <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
        ))}
      </div>

      {isAdmin && (
        <Link href="/admin" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-parchment/80 underline-offset-4 hover:text-white hover:underline">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Administrator review queue
        </Link>
      )}
    </div>
  );
}
