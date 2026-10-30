import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedEmail } from "../src/lib/auth/email-policy.ts";

test("official CIT-U addresses are always accepted", () => {
  assert.equal(isAllowedEmail("student@cit.edu", false), true);
  assert.equal(isAllowedEmail("  Student@CIT.EDU ", false), true);
});

test("Gmail is accepted only when testing is explicitly enabled", () => {
  assert.equal(isAllowedEmail("tester@gmail.com", false), false);
  assert.equal(isAllowedEmail("tester@gmail.com", true), true);
});

test("other or look-alike domains are rejected", () => {
  assert.equal(isAllowedEmail("student@cit.edu.ph", true), false);
  assert.equal(isAllowedEmail("student@notcit.edu", true), false);
  assert.equal(isAllowedEmail("", true), false);
  assert.equal(isAllowedEmail(undefined, true), false);
});
