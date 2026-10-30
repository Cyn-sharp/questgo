import { QuestError } from "./policy.ts";

export const REPORT_REASONS = {
  harassment: "Harassment or threatening messages",
  scam: "Scam, payment, or reimbursement dispute",
  no_show: "No-show or abandoned quest",
  unsafe: "Unsafe meet-up or behavior",
  inappropriate: "Inappropriate or prohibited quest",
  other: "Something else",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;
export const REPORT_OUTCOMES = ["dismissed", "warned", "suspended"] as const;
export type ReportOutcome = (typeof REPORT_OUTCOMES)[number];

type Participants = { requesterId: string; questRunnerId?: string | null };

export function validateReport(input: Record<string, unknown>) {
  const reason = String(input.reason ?? "");
  if (!Object.hasOwn(REPORT_REASONS, reason)) throw new QuestError("Choose a reason for the report.");
  const details = typeof input.details === "string" ? input.details.trim() : "";
  if (details.length < 10 || details.length > 1000) throw new QuestError("Describe what happened in 10–1,000 characters.");
  return { reason: reason as ReportReason, details };
}

// Reports are tied to a quest so they come from someone who actually dealt
// with the reported user. Anyone may report the poster of a quest they can
// see (e.g. a prohibited listing); otherwise only the other participant.
export function reportTarget(quest: Participants, uid: string) {
  if (uid === quest.requesterId) {
    if (!quest.questRunnerId) throw new QuestError("There is no runner to report on this quest yet.", 409);
    return quest.questRunnerId;
  }
  return quest.requesterId;
}

export function validateBlockTarget(uid: string, targetId: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(targetId)) throw new QuestError("Invalid user.");
  if (uid === targetId) throw new QuestError("You cannot block yourself.");
  return targetId;
}

export function validateResolution(input: Record<string, unknown>) {
  const outcome = String(input.outcome ?? "");
  if (!REPORT_OUTCOMES.includes(outcome as ReportOutcome)) throw new QuestError("Choose an outcome.");
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length < 10 || note.length > 2000) throw new QuestError("Explain the decision in 10–2,000 characters.");
  return { outcome: outcome as ReportOutcome, note };
}

export function reportId(questId: string, reporterId: string) {
  return `${questId}_${reporterId}`;
}
