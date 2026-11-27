import assert from "node:assert/strict";
import test from "node:test";
import { canPostAndAccept, idCheckState, idLockedMessage, idRejectReason } from "../src/lib/auth/id-check.ts";

test("only the three known ID statuses are recognised", () => {
  assert.equal(idCheckState({ idStatus: "approved" }), "approved");
  assert.equal(idCheckState({ idStatus: "pending" }), "pending");
  assert.equal(idCheckState({ idStatus: "rejected" }), "rejected");
  for (const idStatus of [undefined, null, "", "APPROVED", "yes", true, 1, {}]) {
    assert.equal(idCheckState({ idStatus }), "missing");
  }
  assert.equal(idCheckState(undefined), "missing");
  assert.equal(idCheckState(null), "missing");
});

test("only approved students and admins can post and accept quests", () => {
  assert.equal(canPostAndAccept("approved", false), true);
  for (const state of ["pending", "rejected", "missing"]) {
    assert.equal(canPostAndAccept(state, false), false);
    assert.equal(canPostAndAccept(state, true), true);
  }
});

test("the locked message tells students what to do", () => {
  assert.equal(idLockedMessage("pending", "post"), "We're still checking your CIT-U ID. You can post quests once an admin approves it.");
  assert.equal(idLockedMessage("pending", "accept"), "We're still checking your CIT-U ID. You can accept quests once an admin approves it.");
  assert.match(idLockedMessage("rejected", "accept"), /wasn't approved\. Send a new one in Profile → Verification to accept quests/);
  assert.equal(idLockedMessage("missing", "post"), "Verify your CIT-U ID in Profile → Verification to post quests.");
});

test("the rejection reason is cleaned up for display", () => {
  assert.equal(idRejectReason({ idRejectReason: "  Photo is blurry  " }), "Photo is blurry");
  assert.equal(idRejectReason({ idRejectReason: 42 }), "");
  assert.equal(idRejectReason(undefined), "");
  assert.equal(idRejectReason({ idRejectReason: "x".repeat(500) }).length, 300);
});