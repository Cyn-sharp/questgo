import { QuestError } from "./policy.ts";

// Bump when the Runner Terms change so earlier acceptances stay traceable.
export const RUNNER_TERMS_VERSION = "2026-11";

// Self-declaration only. We store that each statement was confirmed, never a
// diagnosis, medical record or free-text health detail.
export const RUNNER_DECLARATIONS = [
  { key: "mobility", label: "I can walk around campus and carry light items, such as printed documents or a small bag, without risk to myself or others." },
  { key: "noRestriction", label: "I have no medical condition or physician's restriction that would make running errands unsafe for me or for others." },
  { key: "stopIfUnwell", label: "I will only accept a quest when I am well enough to finish it, and I will hand it back or cancel if my health changes." },
] as const;

export type RunnerStatus = "none" | "pending" | "approved" | "rejected";

const text = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

export function validateApplication(input: unknown) {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const availability = text(body.availability);
  if (availability.length < 10 || availability.length > 300 || !/\p{L}/u.test(availability)) throw new QuestError("Tell us when you are usually free (10–300 characters).");
  const declared = (body.declarations && typeof body.declarations === "object" ? body.declarations : {}) as Record<string, unknown>;
  if (!RUNNER_DECLARATIONS.every((item) => declared[item.key] === true)) throw new QuestError("Confirm every health and fitness statement to apply.");
  if (body.healthConsent !== true) throw new QuestError("Consent to the use of your self-declaration is required.");
  if (body.termsAccepted !== true || body.termsVersion !== RUNNER_TERMS_VERSION) throw new QuestError("Read and accept the current Runner Terms.");
  return { availability, declarations: Object.fromEntries(RUNNER_DECLARATIONS.map((item) => [item.key, true])), termsVersion: RUNNER_TERMS_VERSION };
}

export function validateRunnerDecision(input: unknown) {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (body.outcome !== "approve" && body.outcome !== "reject") throw new QuestError("Choose approve or reject.");
  const note = text(body.note);
  if (note.length > 500) throw new QuestError("Keep the note within 500 characters.");
  if (body.outcome === "reject" && note.length < 5) throw new QuestError("Tell the applicant why (at least 5 characters).");
  return { outcome: body.outcome as "approve" | "reject", note };
}

export const isApprovedRunner = (application: { status?: unknown } | undefined) => application?.status === "approved";
