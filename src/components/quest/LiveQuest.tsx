"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuest, useQuestClock } from "@/hooks/useQuests";
import { getQuestExpirationMillis } from "@/lib/db/quests";
import { questRequest } from "@/lib/quests/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function LiveQuest({ id, participantsOnly = false }: { id: string; participantsOnly?: boolean }) {
  const { user, quest, loading, error } = useQuest(id);
  const now = useQuestClock();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState("");
  if (loading) return <p className="page-container py-10 text-white">Loading quest…</p>;
  if (error || !quest || !user) return <div className="page-container py-10 text-white"><p role="alert">{error || "Quest not found or you are signed out."}</p><Link href="/requests">Back to My Requests</Link></div>;
  const requester = user.uid === quest.requesterId;
  const runner = user.uid === quest.questRunnerId;
  if (participantsOnly && !requester && !runner) return <p role="alert" className="page-container py-10 text-white">Only this quest’s participants can open its active workspace.</p>;
  const remaining = Math.max(0, (getQuestExpirationMillis(quest) ?? 0) - now);
  const expired = quest.status === "available" && remaining === 0;
  const status = expired ? "expired" : quest.status;
  async function act(action: string) {
    if (pending) return;
    setPending(true); setActionError("");
    try {
      await questRequest(`/${encodeURIComponent(id)}`, { action });
      if (action === "accept") router.replace(`/quests/active?id=${encodeURIComponent(id)}`);
    } catch (error) { setActionError(error instanceof Error ? error.message : "Unable to update quest."); }
    finally { setPending(false); }
  }
  return <div className="page-container py-8 max-w-4xl">
    <Link href="/requests" className="text-white underline">My Requests & running quests</Link>
    <Card className="mt-5 p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap justify-between gap-3"><span className="badge-gold">{quest.category}</span><span className="font-semibold capitalize">{status.replaceAll("_", " ")}</span></div>
      <h1 className="text-3xl font-bold text-maroon">{quest.title}</h1>
      <p className="whitespace-pre-wrap break-words">{quest.description}</p>
      <p className="text-2xl font-bold">₱{quest.reward.toLocaleString()} <span className="text-sm font-normal">Cash on delivery</span></p>
      <dl className="grid sm:grid-cols-2 gap-4">
        <div><dt className="font-semibold">Requester</dt><dd>{quest.requesterName || "Requester"}{requester && " (you)"}</dd></div>
        <div><dt className="font-semibold">Runner</dt><dd>{quest.runnerName || "Waiting for a runner"}{runner && " (you)"}</dd></div>
        <div><dt className="font-semibold">Pickup location</dt><dd>{quest.location}</dd></div>
        <div><dt className="font-semibold">Meet-up point</dt><dd>{quest.meetUpPoint}</dd></div>
        <div><dt className="font-semibold">Preferred time</dt><dd>{quest.preferredTime}</dd></div>
        {quest.status === "available" && <div><dt className="font-semibold">Time to accept</dt><dd>{expired ? "Expired" : `${Math.floor(remaining / 60000)}:${String(Math.floor(remaining / 1000) % 60).padStart(2, "0")}`}</dd></div>}
      </dl>
      {quest.completionRequestedAt && quest.status === "in_progress" ? <p className="rounded-xl bg-amber-50 p-4">The runner has marked the work ready. The requester must confirm receipt and cash payment to complete the quest.</p> : null}
      {requester && quest.status === "available" && !expired && <p>Waiting for a runner. You can post again after this quest is cancelled, expires, or is completed.</p>}
      {actionError && <p role="alert" className="text-red-700">{actionError}</p>}
      <div className="flex flex-wrap gap-3">
        {!requester && status === "available" && <Button disabled={pending} onClick={() => act("accept")}>Accept Quest</Button>}
        {requester && quest.status === "available" && <Button variant="outline" disabled={pending} onClick={() => act("cancel")}>Cancel Quest</Button>}
        {runner && status === "accepted" && <Button disabled={pending} onClick={() => act("start")}>Start Quest</Button>}
        {runner && status === "in_progress" && !quest.completionRequestedAt && <Button disabled={pending} onClick={() => act("request-completion")}>Mark Work Ready</Button>}
        {requester && status === "in_progress" && Boolean(quest.completionRequestedAt) && <Button disabled={pending} onClick={() => act("complete")}>Confirm Receipt & Cash Payment</Button>}
        {(requester || runner) && ["accepted", "in_progress", "completed"].includes(status) && <Link className="btn-outline" href={`/messenger?id=${encodeURIComponent(id)}`}>{status === "completed" ? "View Conversation" : "Open Messenger"}</Link>}
      </div>
      {pending && <p role="status">Updating quest…</p>}
    </Card>
  </div>;
}
