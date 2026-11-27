export const COURSES = [
  "BS Computer Engineering Student",
  "BS Computer Science Student",
  "BS Information Technology Student",
  "BS Information Systems Student",
  "BS Civil Engineering Student",
  "BS Electrical Engineering Student",
  "BS Mechanical Engineering Student",
  "BS Architecture Student",
  "BS Accountancy Student",
  "BS Business Administration Student",
  "BS Hospitality Management Student",
];

/** True only for a course from the list above (used by sign-up and the server). */
export function isCourse(value: unknown): value is string {
  return typeof value === "string" && COURSES.includes(value);
}

/** The course without the trailing " Student", for dropdowns: "BS Computer Science". */
export function courseLabel(course: string) {
  return course.replace(/ Student$/, "");
}