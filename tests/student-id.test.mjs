import assert from "node:assert/strict";
import test from "node:test";
import { STUDENT_ID_MAX_BYTES, detectStudentIdImage, studentIdPickProblem } from "../src/lib/auth/student-id.ts";

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const text = (value) => new TextEncoder().encode(value);

test("the ID picker accepts JPG and PNG photos only", () => {
  assert.equal(studentIdPickProblem({ type: "image/jpeg", size: 3_000_000 }), "");
  assert.equal(studentIdPickProblem({ type: "image/png", size: 1 }), "");
  for (const type of ["application/pdf", "image/heic", "image/gif", ""]) {
    assert.match(studentIdPickProblem({ type, size: 100 }), /JPG or PNG/);
  }
});

test("the ID picker rejects empty and huge files", () => {
  assert.match(studentIdPickProblem({ type: "image/jpeg", size: 0 }), /empty/);
  assert.match(studentIdPickProblem({ type: "image/png", size: 21 * 1024 * 1024 }), /too large/);
});

test("the server recognises real JPG and PNG bytes", () => {
  assert.equal(detectStudentIdImage(JPEG), "image/jpeg");
  assert.equal(detectStudentIdImage(PNG), "image/png");
});

test("the server rejects files that only pretend to be photos", () => {
  assert.equal(detectStudentIdImage(text("%PDF-1.7 not a photo")), null);
  assert.equal(detectStudentIdImage(text("<script>alert(1)</script>")), null);
  assert.equal(detectStudentIdImage(new Uint8Array()), null);
  assert.equal(detectStudentIdImage(JPEG.slice(0, 2)), null);
  assert.equal(detectStudentIdImage(PNG.slice(0, 8)), null);
});

test("an ID photo always fits inside one Firestore document", () => {
  assert.ok(STUDENT_ID_MAX_BYTES < 1024 * 1024);
});