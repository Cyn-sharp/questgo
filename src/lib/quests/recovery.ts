import { QuestError } from "./policy.ts";
export const RESPONSE_WINDOW_MS = 10 * 60 * 1000;
export type RecoveryQuest = {
  requesterId: string; questRunnerId?: string; status: string; workflowVersion?: number;
  committedAt?: unknown; fundingMethod?: string; purchaseBudget?: number; actualExpense?: number; receiptRecordedAt?: unknown;
  expenseApproved?: boolean; vendorPaymentConfirmedAt?: unknown; completionRequestedAt?: unknown; paymentReceivedAt?: unknown;
  issueRequestedBy?: string; issueDeadline?: { toMillis(): number }; settlementConfirmedBy?: string[];
};
export function recoveryChanges(q: RecoveryQuest, uid: string, action: string, input: Record<string, unknown>, now: number): Record<string, unknown> | null {
  const requester = uid === q.requesterId, runner = uid === q.questRunnerId;
  const actions = ["leave", "open-issue", "escalate-issue", "confirm-vendor-payment", "record-expense", "approve-expense", "commit", "confirm-settlement", "withdraw-issue", "acknowledge-payment", "record-receipt"];
  if (!actions.includes(action)) return null;
  if (!requester && !runner) throw new QuestError("Only quest participants can perform this action.", 403);
  const active = ["accepted", "in_progress"].includes(q.status);
  const reason = () => {
    if (typeof input.reason !== "string" || input.reason.trim().length < 5 || input.reason.trim().length > 1000) throw new QuestError("Describe the issue or reason (5–1,000 characters).");
    return input.reason.trim();
  };
  if (action === "acknowledge-payment" && runner && q.status === "in_progress" && q.completionRequestedAt && !q.issueRequestedBy && !q.paymentReceivedAt) return { paymentReceived: true };
  if (action === "leave" && active) {
    const text = reason();
    // Legacy quests may already involve costs: route them to settlement conservatively.
    return { status: q.workflowVersion === 2 && !q.committedAt && !q.completionRequestedAt ? "cancelled" : "settlement", closedReason: runner ? "runner_withdrew" : "requester_cancelled", issueReason: text, issueRequestedBy: uid };
  }
  if (action === "withdraw-issue" && active && q.issueRequestedBy === uid) return { clearIssue: true };
  if (action === "open-issue" && active && !q.issueRequestedBy) return { issueReason: reason(), issueRequestedBy: uid, deadlineMillis: now + RESPONSE_WINDOW_MS };
  if (action === "escalate-issue" && active && q.issueRequestedBy && q.issueDeadline && q.issueDeadline.toMillis() <= now) return { status: q.workflowVersion === 2 && !q.committedAt && !q.completionRequestedAt ? "cancelled" : "settlement", review: Boolean(q.committedAt) || q.workflowVersion !== 2 || Boolean(q.completionRequestedAt), closedReason: "response_timeout" };
  if (action === "confirm-vendor-payment" && requester && ["available", "accepted", "in_progress"].includes(q.status) && q.fundingMethod === "prepaid" && !q.vendorPaymentConfirmedAt && !q.committedAt) return { vendorPaid: true };
  if (action === "record-expense" && runner && active && q.fundingMethod === "abono" && !q.committedAt && !q.issueRequestedBy) {
    const amount = input.amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > (q.purchaseBudget ?? 0) || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) throw new QuestError("Enter a cost within the agreed advance limit, with up to two decimal places.");
    if (typeof input.evidence !== "string" || input.evidence.trim().length < 5 || input.evidence.trim().length > 1000) throw new QuestError("Provide the vendor quote or receipt details (5–1,000 characters).");
    return { actualExpense: amount, expenseEvidence: input.evidence.trim(), expenseApproved: false };
  }
  if (action === "record-receipt" && runner && active && q.fundingMethod === "abono" && q.committedAt && !q.completionRequestedAt && !q.issueRequestedBy) {
    if (typeof input.amount !== "number" || !Number.isFinite(input.amount) || input.amount <= 0 || input.amount > (q.actualExpense ?? 0) || Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 0.00001) throw new QuestError("Actual purchase cost cannot exceed the approved amount.");
    if (typeof input.evidence !== "string" || input.evidence.trim().length < 5 || input.evidence.trim().length > 1000) throw new QuestError("Record receipt details (5–1,000 characters).");
    return { actualExpense: input.amount, expenseEvidence: input.evidence.trim(), receiptRecorded: true };
  }
  if (action === "approve-expense" && requester && active && q.actualExpense && !q.committedAt && !q.issueRequestedBy) return { expenseApproved: true };
  if (action === "commit" && runner && q.status === "in_progress" && q.workflowVersion === 2 && !q.committedAt && !q.issueRequestedBy) {
    if (q.fundingMethod === "prepaid" && !q.vendorPaymentConfirmedAt) throw new QuestError("Wait for the requester to acknowledge vendor payment.", 409);
    if (q.fundingMethod === "abono" && !q.expenseApproved) throw new QuestError("Record the cost and get requester approval before spending.", 409);
    return { committed: true };
  }
  if (action === "confirm-settlement" && q.status === "settlement") {
    const confirmed = [...new Set([...(q.settlementConfirmedBy ?? []), uid])];
    return { settlementConfirmedBy: confirmed, ...(confirmed.includes(q.requesterId) && q.questRunnerId && confirmed.includes(q.questRunnerId) ? { status: "cancelled", settled: true } : {}) };
  }
  throw new QuestError("This action is unavailable at the current quest stage.", 409);
}
