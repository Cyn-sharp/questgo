import assert from "node:assert/strict";
import test from "node:test";
import { caseEventLabel, caseReason, filterCases, fundingLabel, questStatusLabel } from "../src/lib/admin/presentation.ts";
import { auditCategory, describeAuditAction } from "../src/lib/admin/audit-labels.ts";

test("settlement cases say why the quest stopped", () => {
  assert.equal(caseReason("runner_suspended"), "The runner's account was suspended");
  assert.equal(caseReason("abandoned_no_activity"), "No activity for 2 hours");
  assert.equal(caseReason(""), "Cancelled or unfinished handover");
  assert.equal(caseReason("constructor"), "Cancelled or unfinished handover");
});

test("funding methods use the app's own names", () => {
  assert.equal(fundingLabel("abono"), "Runner advances payment (abono)");
  assert.equal(fundingLabel("prepaid"), "Requester pays vendor directly");
  assert.equal(fundingLabel(""), "Not recorded");
  assert.equal(fundingLabel("toString"), "Not recorded");
});

test("quest statuses and activity steps read as plain English", () => {
  assert.equal(questStatusLabel("settlement"), "Waiting for admin (settlement)");
  assert.equal(questStatusLabel("on_hold"), "On hold");
  assert.equal(caseEventLabel("escalate-issue"), "Sent to admin: no reply in 10 minutes");
  assert.equal(caseEventLabel("account-suspended"), "Suspended an account");
  assert.equal(caseEventLabel("brand-new_step"), "Brand new step");
  assert.equal(caseEventLabel(undefined), "Activity");
});

test("case search also finds the reason", () => {
  const rows = [{ id: "a", title: "Print notes", closedReason: "runner_suspended" }, { id: "b", title: "Buy lunch", closedReason: "abandoned_no_activity", issueReason: "Runner stopped replying" }];
  assert.deepEqual(filterCases(rows, "suspended", "all").map((row) => row.id), ["a"]);
  assert.deepEqual(filterCases(rows, "stopped replying", "all").map((row) => row.id), ["b"]);
});

test("closing a suspended student's other reports is named and filed under Reports", () => {
  assert.deepEqual(describeAuditAction("reports-closed-on-suspension"), { label: "Other reports closed after suspension", tone: "neutral" });
  assert.equal(auditCategory("reports-closed-on-suspension"), "reports");
  assert.equal(auditCategory("quests-closed-on-suspension"), "reports");
});