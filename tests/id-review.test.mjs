import assert from "node:assert/strict";
import test from "node:test";
import { ID_REASON_MAX, ID_REJECT_REASONS, validateIdDecision } from "../src/lib/auth/id-review.ts";

test("approving an ID needs no reason, and any typed reason is dropped", () => {
  assert.deepEqual(validateIdDecision({ outcome: "approve", submittedAt: "2026-11-26T09:00:00.000Z" }), { outcome: "approve", reason: "", submittedAt: "2026-11-26T09:00:00.000Z" });
  assert.deepEqual(validateIdDecision({ outcome: "approve", reason: "looks fine" }), { outcome: "approve", reason: "", submittedAt: "" });
});

test("rejecting an ID needs a reason the student can act on", () => {
  assert.deepEqual(validateIdDecision({ outcome: "reject", reason: "  Photo   is blurry  ", submittedAt: "x" }), { outcome: "reject", reason: "Photo is blurry", submittedAt: "x" });
  assert.throws(() => validateIdDecision({ outcome: "reject" }), /at least 5 characters/);
  assert.throws(() => validateIdDecision({ outcome: "reject", reason: " ok " }), /at least 5 characters/);
  assert.throws(() => validateIdDecision({ outcome: "reject", reason: "x".repeat(ID_REASON_MAX + 1) }), /within 300 characters/);
});

test("only approve or reject are accepted", () => {
  for (const input of [{ outcome: "maybe" }, { outcome: "APPROVE" }, {}, null, "approve", 42]) {
    assert.throws(() => validateIdDecision(input), /Choose approve or reject/);
  }
});

test("every ready-made reason is a valid rejection reason", () => {
  assert.ok(ID_REJECT_REASONS.length >= 3);
  for (const reason of ID_REJECT_REASONS) assert.equal(validateIdDecision({ outcome: "reject", reason }).reason, reason);
});