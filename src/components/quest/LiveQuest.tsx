"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuest, useQuestClock } from "@/hooks/useQuests";
import { getQuestExpirationMillis } from "@/lib/db/quests";
import { questRequest } from "@/lib/quests/client";
import { questNextStep } from "@/lib/quests/progress";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CATEGORY_FIELDS } from "@/lib/quests/requirements";
import { QuestRecovery } from "./QuestRecovery";
import { PrintingFile } from "./PrintingFile";
import { SafetyActions } from "./SafetyActions";

export function LiveQuest({ id, participantsOnly = false }: { id: string; participantsOnly?: boolean }) {
  const { user, quest, loading, error } = useQuest(id);
  const now = useQuestClock();
  const router = useRouter();
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
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
    const confirmations: Record<string, string> = {
      complete: "Have you received your item or service and paid the runner reward and any approved reimbursement? Completing this quest makes chat read-only.",
      "request-cancellation": "Ask to cancel this quest? The other person must agree. Discuss any work already done or money spent in chat first.",
      "approve-cancellation": "Agree to cancel this quest? Make sure you have settled any work or money spent. This does not issue a refund and will make chat read-only.",
    };
    if (confirmations[action] && !window.confirm(confirmations[action])) return;
    if (action === "accept" && quest?.fundingMethod === "abono" && !window.confirm(`This quest requires you to advance up to ₱${quest.purchaseBudget}. The requester owes the approved actual cost plus ₱${quest.reward} reward at handover. Accept this abono arrangement?`)) return;
    setPending(true); setActionError("");
    try {
      await questRequest(`/${encodeURIComponent(id)}`, { action, ...(action === "complete" ? { receiptConfirmed, paymentConfirmed } : {}), ...(action === "accept" && quest?.fundingMethod === "abono" ? { acceptAdvance: true } : {}) });
      if (action === "accept") router.replace(`/quests/active?id=${encodeURIComponent(id)}`);
    } catch (error) { setActionError(error instanceof Error ? error.message : "Unable to update quest."); }
    finally { setPending(false); }
  }
  return <div className="page-container py-8 max-w-4xl">
    <Link href="/requests" className="text-white underline">My Requests & running quests</Link>
    <Card className="mt-5 p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap justify-between gap-3"><span className="badge-gold">{quest.category}</span><span className="font-semibold capitalize">{status.replaceAll("_", " ")}</span></div>
      <h1 className="text-3xl font-bold text-maroon">{quest.title}</h1>
      <section aria-label="Your next step" className="rounded-xl bg-amber-50 p-4 space-y-2">
        <p className="text-sm font-semibold">{requester ? "You are the requester" : runner ? "You are the runner" : "Become this quest's runner"}</p>
        <p>{questNextStep({ ...quest, status }, requester)}</p>
        <p className="text-xs text-gray-600">Posted → Accepted → In progress → Ready for handover → Completed</p>
      </section>
      <p className="whitespace-pre-wrap break-words">{quest.description}</p>
      {quest.requirements && <section aria-label="Task requirements" className="rounded-xl border p-4"><h2 className="font-bold mb-3">Task requirements</h2><dl className="grid sm:grid-cols-2 gap-3">{(CATEGORY_FIELDS[quest.category] || []).map((field) => <div key={field.key}><dt className="font-semibold">{field.label}</dt><dd className="break-words">{quest.requirements?.[field.key]}</dd></div>)}</dl></section>}
      <PrintingFile quest={quest} canOpen={requester || runner} />
      <p className="text-2xl font-bold">₱{quest.reward.toLocaleString()} <span className="text-sm font-normal">Runner reward — separate from purchase cost</span></p>
      <QuestRecovery quest={quest} uid={user.uid} now={now} />
      <dl className="grid sm:grid-cols-2 gap-4">
        <div><dt className="font-semibold">Requester</dt><dd>{quest.requesterName || "Requester"}{requester && " (you)"}</dd></div>
        <div><dt className="font-semibold">Runner</dt><dd>{quest.runnerName || "Waiting for a runner"}{runner && " (you)"}</dd></div>
        <div><dt className="font-semibold">Pickup location</dt><dd>{quest.location}</dd></div>
        <div><dt className="font-semibold">Meet-up point</dt><dd>{quest.meetUpPoint}</dd></div>
        <div><dt className="font-semibold">Preferred time</dt><dd>{quest.preferredTime}</dd></div>
        {quest.status === "available" && <div><dt className="font-semibold">Time to accept</dt><dd>{expired ? "Expired" : `${Math.floor(remaining / 60000)}:${String(Math.floor(remaining / 1000) % 60).padStart(2, "0")}`}</dd></div>}
      </dl>
      {quest.completionRequestedAt && quest.status === "in_progress" ? <p className="rounded-xl bg-amber-50 p-4">The runner has marked the work ready. The runner acknowledges receiving payment, then the requester confirms receipt and payment to complete the quest.</p> : null}
      {requester && quest.status === "available" && !expired && <p>Waiting for a runner. You can post again after this quest is cancelled, expires, or is completed.</p>}
      {quest.cancellationRequestedBy && (requester || runner) && ["accepted", "in_progress"].includes(status) && <section aria-label="Cancellation request" className="rounded-xl bg-amber-50 p-4 space-y-3">
        <p>{quest.cancellationRequestedBy === user.uid ? "You asked to cancel. Waiting for the other person to respond." : "The other person has asked to cancel this quest."} Discuss any costs or work already done in chat before agreeing. Quest progress is paused until this request is resolved.</p>
        {quest.cancellationRequestedBy === user.uid
          ? <Button variant="outline" disabled={pending} onClick={() => act("withdraw-cancellation")}>Withdraw Request</Button>
          : <div className="flex flex-wrap gap-3"><Button disabled={pending} onClick={() => act("approve-cancellation")}>Agree to Cancel</Button><Button variant="outline" disabled={pending} onClick={() => act("decline-cancellation")}>Keep Quest</Button></div>}
      </section>}
      {(requester || runner) && ["accepted", "in_progress"].includes(status) && quest.workflowVersion !== 2 && !quest.cancellationRequestedBy && <Button variant="outline" disabled={pending} onClick={() => act("request-cancellation")}>Request Cancellation</Button>}
      {requester && quest.workflowVersion === 2 && status === "in_progress" && Boolean(quest.completionRequestedAt) && <div className="space-y-2 rounded border p-4"><label className="flex gap-2"><input type="checkbox" checked={receiptConfirmed} onChange={(e) => setReceiptConfirmed(e.target.checked)} />I received and checked the item or service.</label><label className="flex gap-2"><input type="checkbox" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} />I paid the runner reward and any approved reimbursement.</label><p className="text-xs">The runner must also acknowledge receiving payment before completion.</p></div>}
      {actionError && <p role="alert" className="text-red-700">{actionError}</p>}
      <div className="flex flex-wrap gap-3">
        {!requester && status === "available" && <Button disabled={pending} onClick={() => act("accept")}>Accept Quest</Button>}
        {requester && status === "available" && <Button variant="outline" disabled={pending} onClick={() => act("cancel")}>Cancel Quest</Button>}
        {!quest.cancellationRequestedBy && !quest.issueRequestedBy && runner && status === "accepted" && <Button disabled={pending} onClick={() => act("start")}>Start Quest</Button>}
        {!quest.cancellationRequestedBy && runner && status === "in_progress" && !quest.completionRequestedAt && (quest.workflowVersion !== 2 || Boolean(quest.committedAt)) && <Button disabled={pending} onClick={() => act("request-completion")}>Mark Work Ready</Button>}
        {!quest.cancellationRequestedBy && !quest.issueRequestedBy && requester && status === "in_progress" && Boolean(quest.completionRequestedAt) && <Button disabled={pending || (quest.workflowVersion === 2 && (!receiptConfirmed || !paymentConfirmed || !quest.paymentReceivedAt))} onClick={() => act("complete")}>Confirm Receipt & Cash Payment</Button>}
        {(requester || runner) && ["accepted", "in_progress", "settlement", "completed", "cancelled"].includes(status) && <Link className="btn-outline" href={`/messenger?id=${encodeURIComponent(id)}`}>{["completed", "cancelled"].includes(status) ? "View Conversation" : "Open Messenger"}</Link>}
      </div>
      {pending && <p role="status">Updating quest…</p>}
      <SafetyActions quest={quest} uid={user.uid} />
    </Card>
  </div>;
}
