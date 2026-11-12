import test from "node:test";
import assert from "node:assert/strict";
import { validateQuest } from "../src/lib/quests/policy.ts";
import { validateRequirements } from "../src/lib/quests/requirements.ts";
import { validatePrintFile, MAX_PRINT_FILE_BYTES } from "../src/lib/quests/files.ts";

const printing = { fundingMethod: "prepaid", purchaseBudget: 65, vendorInstructions: "Pay campus print shop directly", title: "Print my class module", description: "Print this class module and meet me at the library.", category: "Printing", reward: 30, location: "Library", meetUpPoint: "Main entrance", preferredTime: "4:30 PM", requirements: { paperSize: "A4", copies: "1", pages: "All pages", color: "Color", sides: "Single-sided" } };
test("printing requires an actual server attachment and complete print settings", () => {
  assert.throws(() => validateQuest({ ...printing, attachment: { name: "fake.pdf" } }), /Attach/);
  assert.equal(validateQuest(printing, true).requirements.paperSize, "A4");
  for (const copies of ["0", "101", "1.5", "null"]) assert.throws(() => validateQuest({ ...printing, requirements: { ...printing.requirements, copies } }, true));
  for (const title of ["null", "undefined", "test", "....."]) assert.throws(() => validateQuest({ ...printing, title }, true));
  assert.throws(() => validateQuest({ ...printing, description: "Do it" }, true));
});
test("each category needs useful details and a shopping budget separate from reward", () => {
  for (const category of ["Printing", "Pickup", "Delivery", "Shopping", "Other"]) assert.throws(() => validateRequirements(category, {}));
  const shopping = { items: "Two notebooks", store: "Campus store", budget: "100", substitutions: "Ask me first" };
  assert.equal(validateRequirements("Shopping", shopping).budget, "100");
  assert.throws(() => validateRequirements("Shopping", { ...shopping, budget: "-1" }));
});
test("file checks reject empty, oversized, disguised and unsupported uploads", () => {
  assert.throws(() => validatePrintFile("fake.pdf", "application/pdf", new TextEncoder().encode("not a pdf")));
  assert.throws(() => validatePrintFile("file.pdf", "application/pdf", new Uint8Array(0)));
  assert.throws(() => validatePrintFile("file.pdf", "application/pdf", new Uint8Array(MAX_PRINT_FILE_BYTES + 1)));
  assert.throws(() => validatePrintFile("file.html", "text/html", new TextEncoder().encode("<script>")));
  assert.equal(validatePrintFile("file.pdf", "application/pdf", new TextEncoder().encode("%PDF-1.7\n")).contentType, "application/pdf");
});
