import assert from "node:assert/strict";
import test from "node:test";
import { suspensionChanges } from "../src/lib/quests/recovery.ts";
import { nextAggregate, validateRating } from "../src/lib/quests/ratings.ts";
import { nextWindow } from "../src/lib/quests/ratelimit.ts";
import { isAllowedPhotoUrl } from "../src/lib/auth/profile-photo.ts";

const base = { requesterId: "req", questRunnerId: "run", workflowVersion: 2 };

test("suspended requester's unclaimed quest is cancelled", () => {
  assert.deepEqual(suspensionChanges({ ...base, questRunnerId: undefined, status: "available" }, "req"), { status: "cancelled", closedReason: "requester_suspended" });
});

test("suspension of an uncommitted active quest cancels it; committed work goes to settlement", () => {
  assert.equal(suspensionChanges({ ...base, status: "accepted" }, "run")?.status, "cancelled");
  assert.equal(suspensionChanges({ ...base, status: "in_progress", committedAt: {} }, "run")?.status, "settlement");
  assert.equal(suspensionChanges({ ...base, status: "in_progress", completionRequestedAt: {} }, "req")?.status, "settlement");
  assert.equal(suspensionChanges({ requesterId: "req", questRunnerId: "run", status: "in_progress" }, "run")?.status, "settlement");
  assert.equal(suspensionChanges({ ...base, status: "accepted" }, "run")?.closedReason, "runner_suspended");
});

test("suspension ignores closed quests, outsiders, and a suspended runner on an available quest", () => {
  for (const status of ["completed", "cancelled", "expired", "settlement"]) assert.equal(suspensionChanges({ ...base, status }, "req"), null);
  assert.equal(suspensionChanges({ ...base, status: "in_progress" }, "outsider"), null);
  assert.equal(suspensionChanges({ ...base, status: "available" }, "run"), null);
});

test("ratings accept whole numbers 1-5 and trim comments", () => {
  assert.deepEqual(validateRating({ rating: 5, comment: "  great  " }), { rating: 5, comment: "great" });
  assert.deepEqual(validateRating({ rating: 1 }), { rating: 1, comment: "" });
  for (const bad of [0, 6, 3.5, "5", null, NaN]) assert.throws(() => validateRating({ rating: bad }));
  assert.throws(() => validateRating(null));
  assert.throws(() => validateRating({ rating: 4, comment: "x".repeat(1001) }));
});

test("rating aggregate keeps a rounded average", () => {
  assert.deepEqual(nextAggregate(undefined, 4), { ratingCount: 1, ratingTotal: 4, averageRating: 4 });
  assert.deepEqual(nextAggregate({ ratingCount: 2, ratingTotal: 9 }, 5), { ratingCount: 3, ratingTotal: 14, averageRating: 4.7 });
  assert.equal(nextAggregate({ ratingCount: "x", ratingTotal: undefined }, 3).ratingCount, 1);
});

test("rate limit window counts, blocks past the limit, then resets", () => {
  let s = nextWindow(undefined, 1000, 2, 60000);
  assert.deepEqual([s.count, s.allowed], [1, true]);
  s = nextWindow(s, 2000, 2, 60000); assert.equal(s.allowed, true);
  s = nextWindow(s, 3000, 2, 60000); assert.equal(s.allowed, false);
  s = nextWindow(s, 61001, 2, 60000); assert.deepEqual([s.count, s.allowed], [1, true]);
});

test("profile photos must be https Firebase Storage URLs", () => {
  assert.equal(isAllowedPhotoUrl("https://firebasestorage.googleapis.com/v0/b/x/o/profilePhotos%2Fu?alt=media"), true);
  assert.equal(isAllowedPhotoUrl("https://x.firebasestorage.app/o/a"), true);
  for (const bad of ["http://firebasestorage.googleapis.com/a", "https://evil.com/a.png", "javascript:alert(1)", "https://firebasestorage.googleapis.com.evil.com/a", "", 5, "x".repeat(700)]) assert.equal(isAllowedPhotoUrl(bad), false);
});
