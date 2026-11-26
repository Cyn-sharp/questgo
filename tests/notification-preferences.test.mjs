import test from "node:test";
import assert from "node:assert/strict";
import { alertEnabled, DEFAULT_NOTIFICATION_PREFS, newQuestText, parsePrefs, toggleCategory, wantsNewQuest } from "../src/lib/notifications/preferences.ts";

test("missing or malformed settings fall back to defaults field by field", () => {
  assert.deepEqual(parsePrefs(undefined), { messages: true, questUpdates: true, newQuests: false, newQuestCategories: [] });
  assert.deepEqual(parsePrefs([]), DEFAULT_NOTIFICATION_PREFS);
  assert.deepEqual(parsePrefs({ messages: false, questUpdates: "no", newQuests: true, newQuestCategories: ["Printing", "Bogus", "Printing", 4] }),
    { messages: false, questUpdates: true, newQuests: true, newQuestCategories: ["Printing"] });
});

test("each alert kind follows its own toggle", () => {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, messages: false };
  assert.equal(alertEnabled(prefs, "message"), false);
  assert.equal(alertEnabled(prefs, "questUpdate"), true);
  assert.equal(alertEnabled(prefs, "newQuest"), false);
});

test("choosing every category is the same as choosing none", () => {
  let prefs = { ...DEFAULT_NOTIFICATION_PREFS, newQuests: true };
  prefs = toggleCategory(prefs, "Printing");
  assert.deepEqual(prefs.newQuestCategories, ["Printing"]);
  prefs = toggleCategory(prefs, "Printing");
  assert.deepEqual(prefs.newQuestCategories, []);
  for (const category of ["Printing", "Pickup", "Delivery", "Shopping", "Other"]) prefs = toggleCategory(prefs, category);
  assert.deepEqual(prefs.newQuestCategories, []);
});

test("new-quest alerts skip own, blocked, expired, taken and unwanted quests", () => {
  const now = 1_000_000;
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, newQuests: true };
  const quest = { requesterId: "other", category: "Pickup", status: "available", expiresAt: { toMillis: () => now + 60_000 } };
  const none = new Set();
  assert.equal(wantsNewQuest(quest, "me", prefs, none, now), true);
  assert.equal(wantsNewQuest(quest, "me", DEFAULT_NOTIFICATION_PREFS, none, now), false, "toggle off");
  assert.equal(wantsNewQuest({ ...quest, requesterId: "me" }, "me", prefs, none, now), false, "own quest");
  assert.equal(wantsNewQuest(quest, "me", prefs, new Set(["other"]), now), false, "blocked requester");
  assert.equal(wantsNewQuest({ ...quest, expiresAt: { toMillis: () => now } }, "me", prefs, none, now), false, "expired");
  assert.equal(wantsNewQuest({ ...quest, status: "accepted" }, "me", prefs, none, now), false, "already taken");
  assert.equal(wantsNewQuest(quest, "me", { ...prefs, newQuestCategories: ["Printing"] }, none, now), false, "other category");
  assert.equal(wantsNewQuest(quest, "me", { ...prefs, newQuestCategories: ["Pickup"] }, none, now), true, "chosen category");
});

test("new-quest alert text names the category, title and reward", () => {
  assert.equal(newQuestText({ title: "Print my thesis", category: "Printing", reward: 40 }), "New Printing quest: “Print my thesis” · ₱40");
  assert.equal(newQuestText({ title: "Help", category: "Other", reward: 0 }), "New Other quest: “Help”");
});
