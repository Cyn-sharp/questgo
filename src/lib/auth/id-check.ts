// Where a student is in the CIT-U ID check. No Firebase code here, so the
// server, the pages and the tests all follow the same rules.
//
// Students who aren't approved yet can still log in and look around.
// They just can't post or accept quests until an admin approves their ID.

export type IdCheckState = "approved" | "pending" | "rejected" | "missing";

/** The two things that need an approved ID. */
export type IdLockedAction = "post" | "accept";

/** Reads idStatus from a users/{uid} document. Anything unknown counts as "missing". */
export function idCheckState(user?: { idStatus?: unknown } | null): IdCheckState {
  const status = user?.idStatus;
  return status === "approved" || status === "pending" || status === "rejected" ? status : "missing";
}

/** Approved students can post and accept quests. Admins always can (someone has to approve the first students). */
export function canPostAndAccept(state: IdCheckState, isAdmin: boolean) {
  return isAdmin || state === "approved";
}

/** The message a student sees when they try to post or accept a quest too early. */
export function idLockedMessage(state: IdCheckState, action: IdLockedAction) {
  const doing = action === "post" ? "post quests" : "accept quests";
  if (state === "pending") return `We're still checking your CIT-U ID. You can ${doing} once an admin approves it.`;
  if (state === "rejected") return `Your CIT-U ID photo wasn't approved. Send a new one in Profile → Verification to ${doing}.`;
  return `Verify your CIT-U ID in Profile → Verification to ${doing}.`;
}

/** The admin's reason for a rejection, cleaned up for display. */
export function idRejectReason(user?: { idRejectReason?: unknown } | null) {
  const reason = typeof user?.idRejectReason === "string" ? user.idRejectReason.trim() : "";
  return reason.slice(0, 300);
}