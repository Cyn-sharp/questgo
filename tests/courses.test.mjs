import assert from "node:assert/strict";
import test from "node:test";
import { COURSES, courseLabel, isCourse } from "../src/lib/auth/courses.ts";

test("sign-up accepts only courses from the list", () => {
  for (const course of COURSES) assert.equal(isCourse(course), true);
  for (const value of ["", "BS Nursing Student", "bs computer science student", 42, null, undefined, {}]) {
    assert.equal(isCourse(value), false);
  }
});

test("the course list has no duplicates", () => {
  assert.equal(new Set(COURSES).size, COURSES.length);
  assert.ok(COURSES.length > 0);
});

test("dropdown labels drop the trailing 'Student'", () => {
  assert.equal(courseLabel("BS Computer Science Student"), "BS Computer Science");
  assert.equal(courseLabel("BS Accountancy"), "BS Accountancy");
  for (const course of COURSES) assert.ok(!courseLabel(course).endsWith(" Student"));
});