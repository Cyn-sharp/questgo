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

import { validateProfile } from "../src/lib/auth/profile.ts";

test("profile names are trimmed, bounded and must contain a letter", () => {
  assert.deepEqual(validateProfile({ fullName: "  Juan   dela  Cruz ", course: "BS Computer Science Student" }), { fullName: "Juan dela Cruz", course: "BS Computer Science Student" });
  assert.deepEqual(validateProfile({ fullName: "Ana" }), { fullName: "Ana", course: "" });
  for (const bad of ["", " ", "A", "x".repeat(101), "1234", "Bad\u0000Name", null, 5]) assert.throws(() => validateProfile({ fullName: bad }));
  assert.throws(() => validateProfile(null));
});

test("profile course must come from the known list", () => {
  assert.throws(() => validateProfile({ fullName: "Juan", course: "BS Wizardry" }));
  assert.equal(validateProfile({ fullName: "Juan", course: 5 }).course, ""); // non-strings are ignored, never stored
});

import { requirementError } from "../src/lib/quests/requirements.ts";
import { fundingErrors } from "../src/lib/quests/funding.ts";
import { validateQuest } from "../src/lib/quests/policy.ts";

test("requirement errors are reported per field", () => {
  assert.equal(requirementError("Printing", "copies", "2"), null);
  for (const bad of ["0", "101", "1.5", "", "abc"]) assert.match(requirementError("Printing", "copies", bad), /valid number of copies/);
  assert.equal(requirementError("Printing", "color", "Color"), null);
  assert.equal(requirementError("Printing", "color", ""), "Select a print color.");
  assert.equal(requirementError("Printing", "sides", "Both"), "Select single-sided or double-sided printing.");
  assert.match(requirementError("Pickup", "items", "n/a"), /items to collect/);
  assert.equal(requirementError("Pickup", "unknown", ""), null);
});

test("funding errors point at the right field", () => {
  assert.deepEqual(fundingErrors({ fundingMethod: "no_purchase" }, "Pickup"), {});
  assert.ok(fundingErrors({}, "Pickup").fundingMethod);
  assert.ok(fundingErrors({ fundingMethod: "no_purchase" }, "Printing").fundingMethod);
  assert.ok(fundingErrors({ fundingMethod: "abono", purchaseBudget: 0 }, "Pickup").purchaseBudget);
  assert.ok(fundingErrors({ fundingMethod: "prepaid", purchaseBudget: 50, vendorInstructions: "hi" }, "Pickup").vendorInstructions);
  assert.deepEqual(fundingErrors({ fundingMethod: "prepaid", purchaseBudget: 50, vendorInstructions: "Pay at the counter" }, "Pickup"), {});
  const shopping = (budget) => fundingErrors({ fundingMethod: "abono", purchaseBudget: 100, requirements: { budget } }, "Shopping");
  assert.deepEqual(shopping("100"), {});
  assert.ok(shopping("90").purchaseBudget);
});

test("meet-up time must be a real clock time", () => {
  const quest = { fundingMethod: "no_purchase", purchaseBudget: 0, title: "Pick up my notes", description: "Meet at the main entrance please.", category: "Pickup", reward: 30,
    requirements: { items: "Class notes", collection: "Library desk" }, location: "Library", meetUpPoint: "Main Entrance", preferredTime: "4:30 PM" };
  assert.equal(validateQuest(quest).preferredTime, "4:30 PM");
  assert.equal(validateQuest({ ...quest, preferredTime: "12:05 AM" }).preferredTime, "12:05 AM");
  for (const bad of ["25:00 PM", "0:30 PM", "4:60 PM", "4:30", "soon", "4:30 pm"]) assert.throws(() => validateQuest({ ...quest, preferredTime: bad }), /meet-up time/);
});

import { abandonedChanges, ABANDON_AFTER_MS } from "../src/lib/quests/recovery.ts";

test("abandonment closes quiet quests after two hours and escalates committed ones", () => {
  const now = 10 * ABANDON_AFTER_MS;
  const at = (ms) => ({ toMillis: () => ms });
  const quest = { requesterId: "req", questRunnerId: "run", workflowVersion: 2, status: "accepted", updatedAt: at(now - ABANDON_AFTER_MS - 1) };
  assert.deepEqual(abandonedChanges(quest, 0, now), { status: "cancelled", closedReason: "abandoned_no_activity" });
  assert.equal(abandonedChanges({ ...quest, status: "in_progress", committedAt: {} }, 0, now)?.status, "settlement");
  assert.equal(abandonedChanges({ ...quest, status: "in_progress", completionRequestedAt: {} }, 0, now)?.status, "settlement");
  // Recent status change, acceptance or chat message all count as activity.
  assert.equal(abandonedChanges({ ...quest, updatedAt: at(now - 1000) }, 0, now), null);
  assert.equal(abandonedChanges(quest, now - 1000, now), null);
  assert.equal(abandonedChanges({ ...quest, updatedAt: undefined, acceptedAt: at(now - 1000) }, 0, now), null);
  // Closed or unclaimed quests are never touched; unknown timing is never treated as abandoned.
  for (const status of ["available", "completed", "cancelled", "settlement", "expired"]) assert.equal(abandonedChanges({ ...quest, status }, 0, now), null);
  assert.equal(abandonedChanges({ ...quest, updatedAt: undefined }, 0, now), null);
});

import { attachmentExpired, ATTACHMENT_RETENTION_MS } from "../src/lib/quests/files.ts";

test("printing files are kept until the quest has been closed for seven days", () => {
  const now = 100 * ATTACHMENT_RETENTION_MS;
  const at = (ms) => ({ toMillis: () => ms });
  const old = at(now - ATTACHMENT_RETENTION_MS - 1);
  assert.equal(attachmentExpired({ status: "cancelled", createdAt: old, updatedAt: old, cancelledAt: old }, now), true);
  assert.equal(attachmentExpired({ status: "completed", createdAt: old, updatedAt: old }, now), true);
  assert.equal(attachmentExpired({ status: "expired", createdAt: old }, now), true);
  // The most recent timestamp decides, so a freshly updated closed quest keeps its file.
  assert.equal(attachmentExpired({ status: "cancelled", createdAt: old, updatedAt: at(now - 1000) }, now), false);
  // Open, unclaimed and settlement quests never lose their file; unknown timing is never treated as old.
  for (const status of ["available", "accepted", "in_progress", "settlement"]) assert.equal(attachmentExpired({ status, createdAt: old, updatedAt: old }, now), false);
  assert.equal(attachmentExpired({ status: "cancelled" }, now), false);
});

import { auditEntry } from "../src/lib/quests/audit.ts";

test("audit entries carry who did what to which target, with bounded text", () => {
  const entry = auditEntry({ uid: "admin1", name: "  Ana  " }, "report-suspended", { type: "report", id: "q_u" }, "  reason  ");
  assert.deepEqual(entry, { actorId: "admin1", actorName: "Ana", action: "report-suspended", targetType: "report", targetId: "q_u", details: "reason" });
  assert.equal(auditEntry({ uid: "a", name: "" }, "x", { type: "user", id: "u" }).actorName, "Administrator");
  const long = auditEntry({ uid: "a", name: "n".repeat(500) }, "a".repeat(500), { type: "quest", id: "i".repeat(500) }, "d".repeat(5000));
  assert.deepEqual([long.actorName.length, long.action.length, long.targetId.length, long.details.length], [100, 60, 260, 500]);
});
