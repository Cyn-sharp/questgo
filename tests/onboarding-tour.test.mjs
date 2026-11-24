import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import {
  GUIDE_FACE,
  LAST_STEP,
  NEW_ACCOUNTS_SINCE,
  TOUR_HOME,
  TOUR_STEPS,
  clampStep,
  isNewAccount,
  shouldAutoStart,
  tourStorageKey,
} from "../src/lib/onboarding/tour.ts";

const inPublic = (path) => existsSync(new URL(`../public${path}`, import.meta.url));
// Firebase gives the account's creation time as text like "Tue, 24 Nov 2026 08:00:00 GMT".
const since = Date.parse(NEW_ACCOUNTS_SINCE);
const NEW_ACCOUNT = new Date(since + 60_000).toUTCString(); // made 1 minute after the start date
const OLD_ACCOUNT = new Date(since - 60_000).toUTCString(); // made 1 minute before it

test("the tour has 7 steps, each with its own id, text and pose", () => {
  assert.equal(TOUR_STEPS.length, 7);
  assert.equal(new Set(TOUR_STEPS.map((step) => step.id)).size, TOUR_STEPS.length);
  assert.equal(new Set(TOUR_STEPS.map((step) => step.pose)).size, TOUR_STEPS.length);
  for (const step of TOUR_STEPS) {
    assert.ok(step.title.trim() && step.text.trim(), `${step.id} needs a title and text`);
    assert.match(step.pose, /^\/mascot\/pose-[a-z-]+\.png$/);
  }
});

test("every pose and the face icon exist in public/mascot", () => {
  for (const step of TOUR_STEPS) assert.ok(inPublic(step.pose), `missing file: public${step.pose}`);
  assert.ok(inPublic(GUIDE_FACE), `missing file: public${GUIDE_FACE}`);
});

test("step numbers stay inside the tour", () => {
  assert.equal(clampStep(-1), 0);
  assert.equal(clampStep(3), 3);
  assert.equal(clampStep(99), LAST_STEP);
});

test("only accounts made on or after the start date count as new", () => {
  assert.ok(Number.isFinite(since), "NEW_ACCOUNTS_SINCE must be a valid date");
  assert.ok(since >= Date.parse("2026-11-01T00:00:00+08:00"), "NEW_ACCOUNTS_SINCE looks like a test value; set it back to the real start date");
  assert.equal(isNewAccount(NEW_ACCOUNT), true);
  assert.equal(isNewAccount(new Date(since).toUTCString()), true);
  assert.equal(isNewAccount(OLD_ACCOUNT), false);
  assert.equal(isNewAccount(undefined), false);
  assert.equal(isNewAccount("not a date"), false);
});

test("the tour starts by itself only on Home, only for new accounts, and only once", () => {
  assert.equal(shouldAutoStart(TOUR_HOME, false, NEW_ACCOUNT), true);
  assert.equal(shouldAutoStart(TOUR_HOME, false, OLD_ACCOUNT), false); // existing user
  assert.equal(shouldAutoStart(TOUR_HOME, true, NEW_ACCOUNT), false); // already finished or skipped
  assert.equal(shouldAutoStart("/quests", false, NEW_ACCOUNT), false); // not on Home
  assert.equal(shouldAutoStart(null, false, NEW_ACCOUNT), false);
});

test("'seen' is remembered per account", () => {
  assert.notEqual(tourStorageKey("alice"), tourStorageKey("bob"));
  assert.ok(tourStorageKey("alice").endsWith(":alice"));
});