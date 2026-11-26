import { QuestError } from "../quests/policy.ts";

// Admin review of the CIT-U ID photos students send at sign-up.
// No Firebase code here, so the admin page, the server and the tests share the same rules.

/** Ready-made reasons the admin can pick when a photo can't be approved. They can still type their own. */
export const ID_REJECT_REASONS = [
  "The photo is blurry. Please retake it in good light.",
  "The name on the ID doesn't match your QuestGo account.",
  "This doesn't look like a CIT-U student ID.",
  "Part of the ID is cut off or covered.",
] as const;

export const ID_REASON_MIN = 5;
export const ID_REASON_MAX = 300;

export type IdDecision = { outcome: "approve" | "reject"; reason: string; submittedAt: string };

const clean = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

/**
 * Checks an admin's decision. A rejection needs a reason, because the student sees it.
 * `submittedAt` is when the photo the admin looked at was sent, so the server can
 * tell if the student replaced it in the meantime.
 */
export function validateIdDecision(input: unknown): IdDecision {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (body.outcome !== "approve" && body.outcome !== "reject") throw new QuestError("Choose approve or reject.");
  const submittedAt = typeof body.submittedAt === "string" ? body.submittedAt : "";
  if (body.outcome === "approve") return { outcome: "approve", reason: "", submittedAt };
  const reason = clean(body.reason);
  if (reason.length < ID_REASON_MIN) throw new QuestError(`Tell the student what to fix (at least ${ID_REASON_MIN} characters).`);
  if (reason.length > ID_REASON_MAX) throw new QuestError(`Keep the reason within ${ID_REASON_MAX} characters.`);
  return { outcome: "reject", reason, submittedAt };
}