import test from "node:test";
import assert from "node:assert/strict";
import { recoveryChanges, RESPONSE_WINDOW_MS } from "../src/lib/quests/recovery.ts";
import { validateFunding, fundingSummary } from "../src/lib/quests/funding.ts";
import { canMessage, isActiveQuest } from "../src/lib/quests/policy.ts";
const q = { requesterId: "requester", questRunnerId: "runner", status: "accepted", workflowVersion: 2, fundingMethod: "no_purchase", reward: 30 };
const reason = { reason: "My class schedule changed" };
test("funding is explicit; no-capital errands and optional advances stay distinct", () => {
  assert.throws(() => validateFunding({}, "Pickup"));
  assert.throws(() => validateFunding({ fundingMethod: "no_purchase" }, "Printing"));
  assert.throws(() => validateFunding({ fundingMethod: "requester_transfer", purchaseBudget: 100 }, "Shopping"));
  assert.equal(validateFunding({ fundingMethod: "no_purchase" }, "Delivery").purchaseBudget, 0);
  for (const amount of [NaN, Infinity, 0, -1, 10001, 1.001]) assert.throws(() => validateFunding({ fundingMethod: "abono", purchaseBudget: amount }, "Pickup"));
  assert.throws(() => validateFunding({ fundingMethod: "abono", purchaseBudget: 100, requirements: { budget: "120" } }, "Shopping"));
  assert.deepEqual(fundingSummary({ fundingMethod: "abono", purchaseBudget: 150, actualExpense: 135, reward: 40 }), { label: "Runner advances payment (abono)", upfront: 150, reimbursement: 135, totalDue: 175 });
  assert.equal(fundingSummary({ fundingMethod: "prepaid", purchaseBudget: 150, reward: 40 }).totalDue, 40);
  assert.equal(fundingSummary({ reward: 40 }).upfront, null);
});
test("either participant can leave before commitment; committed and legacy work enters settlement", () => {
  for (const uid of ["requester", "runner"]) {
    assert.equal(recoveryChanges(q, uid, "leave", reason, 0).status, "cancelled");
    assert.equal(recoveryChanges({ ...q, committedAt: true }, uid, "leave", reason, 0).status, "settlement");
    assert.equal(recoveryChanges({ ...q, workflowVersion: undefined }, uid, "leave", reason, 0).status, "settlement");
  }
  assert.throws(() => recoveryChanges(q, "outsider", "leave", reason, 0));
  assert.throws(() => recoveryChanges(q, "runner", "leave", {}, 0));
  assert.throws(() => recoveryChanges({ ...q, status: "completed" }, "runner", "leave", reason, 0));
});
test("abono requires a valid quote, requester approval, and a bounded final receipt", () => {
  const abono = { ...q, status: "in_progress", fundingMethod: "abono", purchaseBudget: 150 };
  assert.throws(() => recoveryChanges(abono, "runner", "commit", {}, 0));
  assert.throws(() => recoveryChanges(abono, "requester", "record-expense", { amount: 120, evidence: "Campus store quote" }, 0));
  assert.throws(() => recoveryChanges(abono, "runner", "record-expense", { amount: 160, evidence: "Campus store quote" }, 0));
  const quoted = { ...abono, ...recoveryChanges(abono, "runner", "record-expense", { amount: 140, evidence: "Campus store quote" }, 0) };
  assert.throws(() => recoveryChanges(quoted, "runner", "approve-expense", {}, 0));
  const approved = { ...quoted, ...recoveryChanges(quoted, "requester", "approve-expense", {}, 0) };
  assert.equal(recoveryChanges(approved, "runner", "commit", {}, 0).committed, true);
  const committed = { ...approved, committedAt: true };
  assert.throws(() => recoveryChanges(committed, "runner", "record-expense", { amount: 100, evidence: "New quote" }, 0));
  assert.throws(() => recoveryChanges(committed, "runner", "record-receipt", { amount: 150, evidence: "Receipt 0123" }, 0));
  assert.equal(recoveryChanges(committed, "runner", "record-receipt", { amount: 135, evidence: "Receipt 0123" }, 0).actualExpense, 135);
});
test("prepaid collection waits for requester acknowledgement", () => {
  const prepaid = { ...q, status: "in_progress", fundingMethod: "prepaid" };
  assert.throws(() => recoveryChanges(prepaid, "runner", "commit", {}, 0));
  assert.throws(() => recoveryChanges(prepaid, "runner", "confirm-vendor-payment", {}, 0));
  assert.equal(recoveryChanges({ ...prepaid, vendorPaymentConfirmedAt: true }, "runner", "commit", {}, 0).committed, true);
});
test("deadline is enforced by the server and never silently settles committed expenses", () => {
  const issue = recoveryChanges(q, "requester", "open-issue", reason, 1000);
  assert.equal(issue.deadlineMillis, 1000 + RESPONSE_WINDOW_MS);
  const pending = { ...q, issueRequestedBy: "requester", issueDeadline: { toMillis: () => 1000 + RESPONSE_WINDOW_MS } };
  assert.throws(() => recoveryChanges(pending, "runner", "escalate-issue", {}, 1000));
  assert.equal(recoveryChanges(pending, "runner", "escalate-issue", {}, 1000 + RESPONSE_WINDOW_MS).status, "cancelled");
  assert.equal(recoveryChanges({ ...pending, committedAt: true }, "runner", "escalate-issue", {}, 1000 + RESPONSE_WINDOW_MS).status, "settlement");
  assert.throws(() => recoveryChanges(pending, "runner", "withdraw-issue", {}, 1000));
  assert.equal(recoveryChanges(pending, "requester", "withdraw-issue", {}, 1000).clearIssue, true);
});
test("settlement stays chat-enabled and requires both acknowledgements", () => {
  const settled = { ...q, status: "settlement" };
  assert.equal(isActiveQuest(settled, 0), false);
  assert.equal(canMessage(settled, "runner"), true);
  assert.equal(canMessage(settled, "outsider"), false);
  const first = recoveryChanges(settled, "requester", "confirm-settlement", {}, 0);
  assert.deepEqual(first.settlementConfirmedBy, ["requester"]);
  assert.equal(first.status, undefined);
  const repeat = recoveryChanges({ ...settled, ...first }, "requester", "confirm-settlement", {}, 0);
  assert.deepEqual(repeat.settlementConfirmedBy, ["requester"]);
  assert.equal(recoveryChanges({ ...settled, ...first }, "runner", "confirm-settlement", {}, 0).status, "cancelled");
});
test("only runner can acknowledge payment after readiness", () => {
  assert.throws(() => recoveryChanges({ ...q, status: "in_progress" }, "runner", "acknowledge-payment", {}, 0));
  const ready = { ...q, status: "in_progress", completionRequestedAt: true };
  assert.throws(() => recoveryChanges(ready, "requester", "acknowledge-payment", {}, 0));
  assert.equal(recoveryChanges(ready, "runner", "acknowledge-payment", {}, 0).paymentReceived, true);
});
