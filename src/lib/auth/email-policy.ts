// The SRS requires official CIT-U accounts. Gmail is accepted only when a
// deployment explicitly opts in for testing with NEXT_PUBLIC_ALLOW_TEST_GMAIL.
export const ALLOW_TEST_GMAIL = process.env.NEXT_PUBLIC_ALLOW_TEST_GMAIL === "true";

export const EMAIL_POLICY_MESSAGE = ALLOW_TEST_GMAIL
  ? "Please use a CIT-U or Gmail address for testing."
  : "Please use your official CIT-U (@cit.edu) email.";

export const EMAIL_PLACEHOLDER = ALLOW_TEST_GMAIL ? "studentname@cit.edu or Gmail" : "studentname@cit.edu";

export function isAllowedEmail(email?: string | null, allowTestGmail = ALLOW_TEST_GMAIL) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.endsWith("@cit.edu") || (allowTestGmail && normalized.endsWith("@gmail.com"));
}
