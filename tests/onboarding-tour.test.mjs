import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import {
  GUIDE_FACE,
  LAST_STEP,
  TOUR_HOME,
  TOUR_STEPS,
  clampStep,
  shouldAutoStart,
  tourStorageKey,
} from "../src/lib/onboarding/tour.ts";

const inPublic = (path) => existsSync(new URL(`../public${path}`, import.meta.url));

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

test("the tour starts by itself only on Home, and only once", () => {
  assert.equal(shouldAutoStart(TOUR_HOME, false), true);
  assert.equal(shouldAutoStart(TOUR_HOME, true), false);
  assert.equal(shouldAutoStart("/quests", false), false);
  assert.equal(shouldAutoStart(null, false), false);
});

test("'seen' is remembered per account", () => {
  assert.notEqual(tourStorageKey("alice"), tourStorageKey("bob"));
  assert.ok(tourStorageKey("alice").endsWith(":alice"));
});