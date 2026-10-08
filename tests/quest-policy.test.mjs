import assert from "node:assert/strict";
import test from "node:test";
import { canMessage, isActiveQuest, transitionQuest, validateQuest } from "../src/lib/quests/policy.ts";

const input = { title: "Print module", category: "Pickup", description: "Collect the printed pages from the library", reward: 30,
  requirements: { items: "Printed module", collection: "Collect from the library desk" }, location: "Library", meetUpPoint: "Main Entrance", preferredTime: "4:30 PM" };
const available = { requesterId: "requester", status: "available", expiresAt: { toMillis: () => 2000 } };

test("cancellation needs agreement from the other participant and pauses progress", () => {
  for (const status of ["accepted", "in_progress"]) {
    const quest = { ...available, status, questRunnerId: "runner", completionRequestedAt: true };
    for (const initiator of ["requester", "runner"]) {
      const other = initiator === "requester" ? "runner" : "requester";
      assert.equal(transitionQuest(quest, initiator, "request-cancellation", 1000), status);
      const pending = { ...quest, cancellationRequestedBy: initiator };
      assert.throws(() => transitionQuest(pending, initiator, "approve-cancellation", 1000));
      assert.throws(() => transitionQuest(pending, "outsider", "approve-cancellation", 1000));
      assert.throws(() => transitionQuest(pending, other, "withdraw-cancellation", 1000));
      assert.throws(() => transitionQuest(pending, "requester", "complete", 1000));
      assert.throws(() => transitionQuest(pending, "runner", "start", 1000));
      assert.equal(transitionQuest(pending, other, "approve-cancellation", 1000), "cancelled");
      assert.equal(transitionQuest(pending, other, "decline-cancellation", 1000), status);
      assert.equal(transitionQuest(pending, initiator, "withdraw-cancellation", 1000), status);
      assert.equal(canMessage(pending, other), true);
      assert.equal(isActiveQuest(pending, 1000), true);
    }
    assert.throws(() => transitionQuest(quest, "outsider", "request-cancellation", 1000));
    assert.throws(() => transitionQuest(quest, "requester", "approve-cancellation", 1000));
  }
  for (const status of ["completed", "cancelled", "available"]) {
    assert.throws(() => transitionQuest({ ...available, status }, "requester", "request-cancellation", 1000));
  }
});

test("quest input rejects malformed rewards and ignores client ownership/status", () => {
  for (const reward of [NaN, Infinity, -1, 0, "30", 10001, 0.001]) assert.throws(() => validateQuest({ ...input, reward }));
  assert.throws(() => validateQuest({ ...input, title: " " }));
  assert.throws(() => validateQuest({ ...input, category: "invented" }));
  assert.deepEqual(validateQuest({ ...input, requesterId: "victim", status: "completed" }), input);
});

test("active restriction lasts through acceptance and work, but expires for unclaimed quests", () => {
  assert.equal(isActiveQuest(available, 1000), true);
  assert.equal(isActiveQuest(available, 2000), false);
  assert.equal(isActiveQuest({ ...available, status: "accepted" }, 3000), true);
  assert.equal(isActiveQuest({ ...available, status: "in_progress" }, 3000), true);
  assert.equal(isActiveQuest({ ...available, status: "completed" }, 1000), false);
});

test("self-acceptance, expiry, unrelated participants and skipped states are rejected", () => {
  assert.throws(() => transitionQuest(available, "requester", "accept", 1000));
  assert.throws(() => transitionQuest(available, "runner", "accept", 2000));
  assert.throws(() => transitionQuest(available, "runner", "complete", 1000));
  assert.equal(transitionQuest(available, "runner", "accept", 1000), "accepted");
  const accepted = { ...available, status: "accepted", questRunnerId: "runner" };
  assert.throws(() => transitionQuest(accepted, "other", "accept", 1000));
  assert.throws(() => transitionQuest(accepted, "requester", "start", 1000));
  assert.equal(transitionQuest(accepted, "runner", "start", 1000), "in_progress");
  const working = { ...accepted, status: "in_progress" };
  assert.throws(() => transitionQuest(working, "requester", "complete", 1000));
  assert.equal(transitionQuest(working, "runner", "request-completion", 1000), "in_progress");
  assert.equal(transitionQuest({ ...working, completionRequestedAt: true }, "requester", "complete", 1000), "completed");
});

test("messaging is limited to both participants during accepted work", () => {
  assert.equal(canMessage(available, "requester"), false);
  const accepted = { ...available, status: "accepted", questRunnerId: "runner" };
  assert.equal(canMessage(accepted, "requester"), true);
  assert.equal(canMessage(accepted, "runner"), true);
  assert.equal(canMessage(accepted, "stranger"), false);
  assert.equal(canMessage({ ...accepted, status: "completed" }, "runner"), false);
});
