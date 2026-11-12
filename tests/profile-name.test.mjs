import assert from "node:assert/strict";
import test from "node:test";
import { getProfileName } from "../src/lib/auth/profile-name.ts";

test("registered identity takes precedence over an older Firestore name", () => {
  assert.equal(getProfileName("Registered Student", "Old Demo Name"), "Registered Student");
});

test("blank values do not hide the available account name", () => {
  assert.equal(getProfileName("  Student Name  ", ""), "Student Name");
  assert.equal(getProfileName("  ", " Legacy Student "), "Legacy Student");
  assert.equal(getProfileName(null, ""), "QuestGo User");
});
