import { COURSES } from "./courses.ts";

export class ProfileError extends Error {}

// Shared by the profile API and tests. Course is optional but must be a known value.
export function validateProfile(input: unknown) {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.replace(/\s+/g, " ").trim() : "";
  if (fullName.length < 2 || fullName.length > 100 || !/\p{L}/u.test(fullName) || /\p{C}/u.test(fullName)) {
    throw new ProfileError("Enter your name (2–100 characters).");
  }
  const course = typeof body.course === "string" ? body.course : "";
  if (course && !COURSES.includes(course)) throw new ProfileError("Choose a course from the list.");
  return { fullName, course };
}
