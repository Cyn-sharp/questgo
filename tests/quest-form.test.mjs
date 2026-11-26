import test from "node:test";
import assert from "node:assert/strict";
import { validateQuest } from "../src/lib/quests/policy.ts";
import { buildQuestPayload, effectiveFunding, fundingMethodsFor, needsPurchaseLimit, needsVendorInstructions, needsFile } from "../src/lib/quests/form.ts";

const form = { title: "Buy notebooks", category: "Shopping", description: "Buy two notebooks at the campus store.", reward: "30", fundingMethod: "prepaid", purchaseBudget: "999", vendorInstructions: "Pay the campus store directly",
  pickupLocation: "Main Library", meetupLocation: "CIT-U Main Entrance", setTime: false, meetupHour: "4", meetupMinute: "30", meetupPeriod: "PM" };
const shopping = { items: "Two notebooks", store: "Campus store", budget: "100", substitutions: "Ask me first" };

test("meet-up time is optional on the server, but still length-checked", () => {
  const base = validateQuest({ ...buildQuestPayload(form, { Shopping: shopping }) });
  assert.equal(base.preferredTime, "");
  const withoutTime = buildQuestPayload(form, { Shopping: shopping });
  delete withoutTime.preferredTime;
  assert.equal(validateQuest(withoutTime).preferredTime, "");
  assert.equal(validateQuest({ ...withoutTime, preferredTime: " 4:30 PM " }).preferredTime, "4:30 PM");
  assert.throws(() => validateQuest({ ...withoutTime, preferredTime: "x".repeat(101) }), /preferredTime/);
  assert.throws(() => validateQuest({ ...withoutTime, preferredTime: 5 }), /preferredTime/);
});

test("other essentials stay required by the server", () => {
  const payload = buildQuestPayload(form, { Shopping: shopping });
  for (const key of ["location", "meetUpPoint", "title", "description", "reward"]) assert.throws(() => validateQuest({ ...payload, [key]: key === "reward" ? 0 : "" }), undefined, key);
  assert.throws(() => validateQuest({ ...payload, requirements: {} }));
  assert.throws(() => validateQuest({ ...payload, fundingMethod: undefined }), /Choose who pays/);
});

test("form shows only fields relevant to category and funding", () => {
  assert.deepEqual(fundingMethodsFor("Printing"), ["prepaid", "abono"]);
  assert.deepEqual(fundingMethodsFor("Pickup"), ["no_purchase", "prepaid", "abono"]);
  assert.equal(needsFile("Printing"), true); assert.equal(needsFile("Pickup"), false);
  assert.equal(needsPurchaseLimit("Pickup", "no_purchase"), false);
  assert.equal(needsPurchaseLimit("Pickup", "abono"), true);
  assert.equal(needsPurchaseLimit("Shopping", "abono"), false); // reuses the item budget
  assert.equal(needsVendorInstructions("prepaid"), true); assert.equal(needsVendorInstructions("abono"), false);
});

test("Shopping purchase limit follows the item budget so it only needs typing once", () => {
  const payload = buildQuestPayload(form, { Shopping: shopping });
  assert.equal(payload.purchaseBudget, 100);
  assert.equal(validateQuest(payload).purchaseBudget, 100);
});

test("switching category and back keeps entered values, and sends only the active category", () => {
  const byCategory = { Shopping: shopping, Pickup: { items: "Notes", collection: "Library desk" } };
  const pickup = buildQuestPayload({ ...form, category: "Pickup", fundingMethod: "no_purchase" }, byCategory);
  assert.deepEqual(pickup.requirements, byCategory.Pickup);
  assert.equal(pickup.purchaseBudget, 0); assert.equal(pickup.vendorInstructions, "");
  assert.equal(validateQuest(pickup).fundingMethod, "no_purchase");
  // "no purchase" is stored but not applicable to Printing/Shopping; it returns when switching back.
  assert.equal(effectiveFunding("Shopping", "no_purchase"), "prepaid");
  assert.equal(effectiveFunding("Pickup", "no_purchase"), "no_purchase");
  assert.deepEqual(buildQuestPayload({ ...form, category: "Shopping" }, byCategory).requirements, shopping);
});

test("abono and vendor instructions are only sent when they apply", () => {
  const abono = buildQuestPayload({ ...form, fundingMethod: "abono" }, { Shopping: shopping });
  assert.equal(abono.vendorInstructions, "");
  assert.equal(validateQuest(abono).fundingMethod, "abono");
  assert.throws(() => validateQuest(buildQuestPayload({ ...form, vendorInstructions: "" }, { Shopping: shopping })), /vendor/i);
});
