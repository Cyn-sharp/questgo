// CIT-U (@cit.edu) addresses are always accepted. Gmail is accepted only when
// the deployment sets NEXT_PUBLIC_ALLOW_TEST_GMAIL=true. Students are then
// confirmed by the admin ID check (a photo of their CIT-U ID) instead.
export const ALLOW_TEST_GMAIL = process.env.NEXT_PUBLIC_ALLOW_TEST_GMAIL === "true";

export const EMAIL_POLICY_MESSAGE = ALLOW_TEST_GMAIL
  ? "Please use your CIT-U (@cit.edu) or Gmail address."
  : "Please use your official CIT-U (@cit.edu) email.";

export const EMAIL_PLACEHOLDER = ALLOW_TEST_GMAIL ? "studentname@cit.edu or Gmail" : "studentname@cit.edu";

export function isAllowedEmail(email?: string | null, allowTestGmail = ALLOW_TEST_GMAIL) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.endsWith("@cit.edu") || (allowTestGmail && normalized.endsWith("@gmail.com"));
}