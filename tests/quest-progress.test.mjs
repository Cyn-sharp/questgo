import test from "node:test";
import assert from "node:assert/strict";
import { questUpdate, questNextStep } from "../src/lib/quests/progress.ts";

test("quest alerts describe real transitions and ignore unchanged snapshots", () => {
  const accepted = { status: "accepted" };
  assert.equal(questUpdate(accepted, { ...accepted }, true), null);
  assert.match(questUpdate({ status: "available" }, accepted, true), /was accepted/);
  assert.match(questUpdate(accepted, { status: "in_progress" }, true), /runner has started/);
  const working = { status: "in_progress" };
  assert.match(questUpdate(working, { ...working, completionRequestedAt: true }, true), /quest is ready/);
  assert.match(questUpdate(working, { ...working, completionRequestedAt: true }, false), /Waiting for the requester/);
  assert.match(questUpdate(working, { status: "cancelled" }, true), /cancelled/);
});

test("next step distinguishes requester and runner, cancellation and finished work", () => {
  assert.match(questNextStep({ status: "accepted" }, false), /Start Quest/);
  assert.match(questNextStep({ status: "accepted" }, true), /Open chat/);
  assert.match(questNextStep({ status: "in_progress", completionRequestedAt: true }, false), /requester needs to confirm/);
  assert.match(questNextStep({ status: "in_progress", cancellationRequestedBy: "runner" }, true), /cancellation/);
  assert.match(questNextStep({ status: "expired" }, true), /post a new quest/);
});
