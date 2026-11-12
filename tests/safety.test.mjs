import assert from "node:assert/strict";
import test from "node:test";
import { reportTarget, validateBlockTarget, validateReport, validateResolution } from "../src/lib/quests/safety.ts";

const quest = { requesterId: "requester", questRunnerId: "runner" };

test("reports need a known reason and meaningful details", () => {
  assert.deepEqual(validateReport({ reason: "no_show", details: "  Never arrived at the gate  " }), { reason: "no_show", details: "Never arrived at the gate" });
  assert.throws(() => validateReport({ reason: "spam", details: "Never arrived at the gate" }));
  assert.throws(() => validateReport({ reason: "toString", details: "Never arrived at the gate" }));
  assert.throws(() => validateReport({ reason: "other", details: "short" }));
  assert.throws(() => validateReport({ reason: "other", details: "x".repeat(1001) }));
});

test("each side reports the other participant; outsiders can only report the poster", () => {
  assert.equal(reportTarget(quest, "requester"), "runner");
  assert.equal(reportTarget(quest, "runner"), "requester");
  assert.equal(reportTarget(quest, "outsider"), "requester");
  assert.throws(() => reportTarget({ requesterId: "requester" }, "requester"));
});

test("users cannot block themselves or malformed ids", () => {
  assert.equal(validateBlockTarget("me", "other"), "other");
  assert.throws(() => validateBlockTarget("me", "me"));
  assert.throws(() => validateBlockTarget("me", "../users"));
});

test("admin decisions need an outcome and a written explanation", () => {
  assert.deepEqual(validateResolution({ outcome: "warned", note: "Warned over chat conduct" }), { outcome: "warned", note: "Warned over chat conduct" });
  assert.throws(() => validateResolution({ outcome: "banned", note: "Warned over chat conduct" }));
  assert.throws(() => validateResolution({ outcome: "dismissed", note: "ok" }));
});
