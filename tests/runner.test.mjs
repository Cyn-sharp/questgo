import assert from "node:assert/strict";
import test from "node:test";
import { RUNNER_DECLARATIONS, RUNNER_TERMS_VERSION, isApprovedRunner, validateApplication, validateRunnerDecision } from "../src/lib/quests/runner.ts";

const declarations = Object.fromEntries(RUNNER_DECLARATIONS.map((item) => [item.key, true]));
const good = { availability: "  Weekdays after 1 PM, near the library ", declarations, healthConsent: true, termsAccepted: true, termsVersion: RUNNER_TERMS_VERSION };

test("a complete application is accepted and normalised", () => {
  const result = validateApplication(good);
  assert.equal(result.availability, "Weekdays after 1 PM, near the library");
  assert.deepEqual(result.declarations, declarations);
});

test("every statement, the consent and the current terms are required", () => {
  assert.throws(() => validateApplication({ ...good, declarations: { ...declarations, mobility: false } }));
  assert.throws(() => validateApplication({ ...good, declarations: {} }));
  assert.throws(() => validateApplication({ ...good, healthConsent: false }));
  assert.throws(() => validateApplication({ ...good, termsAccepted: false }));
  assert.throws(() => validateApplication({ ...good, termsVersion: "1999-01" }));
  assert.throws(() => validateApplication(null));
});

test("availability must be meaningful text", () => {
  assert.throws(() => validateApplication({ ...good, availability: "short" }));
  assert.throws(() => validateApplication({ ...good, availability: "1234567890" }));
  assert.throws(() => validateApplication({ ...good, availability: "x".repeat(301) }));
});

test("extra health details are never carried into the stored record", () => {
  const result = validateApplication({ ...good, diagnosis: "private detail", declarations: { ...declarations, notes: "private detail" } });
  assert.deepEqual(Object.keys(result).sort(), ["availability", "declarations", "termsVersion"]);
  assert.deepEqual(Object.keys(result.declarations).sort(), RUNNER_DECLARATIONS.map((item) => item.key).sort());
});

test("admin decisions: rejection needs a reason, approval does not", () => {
  assert.deepEqual(validateRunnerDecision({ outcome: "approve" }), { outcome: "approve", note: "" });
  assert.deepEqual(validateRunnerDecision({ outcome: "reject", note: " Incomplete details " }), { outcome: "reject", note: "Incomplete details" });
  assert.throws(() => validateRunnerDecision({ outcome: "reject" }));
  assert.throws(() => validateRunnerDecision({ outcome: "maybe" }));
  assert.throws(() => validateRunnerDecision({ outcome: "approve", note: "x".repeat(501) }));
});

test("only an approved application counts as a Verified Runner", () => {
  assert.equal(isApprovedRunner({ status: "approved" }), true);
  for (const status of ["pending", "rejected", undefined]) assert.equal(isApprovedRunner({ status }), false);
  assert.equal(isApprovedRunner(undefined), false);
});
