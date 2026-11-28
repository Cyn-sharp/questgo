import { FUNDING_LABELS } from "../quests/funding.ts";

export type AdminCaseRow = { id: string; title?: string; closedReason?: string; issueReason?: string; requesterName?: string; runnerName?: string; actualExpense?: number; fundingMethod?: string; createdAt?: string | null };
export type AdminReportRow = { id: string; questId: string; questTitle?: string; reporterName?: string; reportedName?: string; reportedId: string; reason?: string; details?: string; createdAt?: string | null };

function includesQuery(values: Array<string | undefined>, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  return !normalized || values.some((value) => value?.toLocaleLowerCase().includes(normalized));
}

export function filterCases<T extends AdminCaseRow>(items: T[], search: string, funding: string) {
  return items.filter((item) => includesQuery([item.title, item.requesterName, item.runnerName, caseReason(item.closedReason), item.issueReason], search) && (funding === "all" || item.fundingMethod === funding));
}

export function filterReports<T extends AdminReportRow>(items: T[], search: string, outcomeFilter: string, outcomes: Record<string, string>) {
  return items.filter((item) => includesQuery([item.questTitle, item.reporterName, item.reportedName, item.reason, item.details], search) && (outcomeFilter === "all" || (outcomeFilter === "unassigned" ? !outcomes[item.id] : outcomes[item.id] === outcomeFilter)));
}

function timestamp(value?: string | null) {
  if (!value) return Number.NaN;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function sortByAge<T extends { createdAt?: string | null }>(items: T[], direction: "oldest" | "newest") {
  const factor = direction === "oldest" ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = timestamp(a.createdAt), right = timestamp(b.createdAt);
    if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0;
    if (!Number.isFinite(right)) return -1;
    return (left - right) * factor;
  });
}

export function sortByAmount<T extends { actualExpense?: number }>(items: T[], direction: "low" | "high") {
  const factor = direction === "low" ? 1 : -1;
  return [...items].sort((a, b) => ((a.actualExpense ?? 0) - (b.actualExpense ?? 0)) * factor);
}

export function formatAge(value?: string | null, now = Date.now()) {
  const time = timestamp(value);
  if (!Number.isFinite(time)) return "Age unavailable";
  const minutes = Math.max(0, Math.floor((now - time) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function repeatReportCounts<T extends { reportedId: string }>(items: T[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item.reportedId] = (counts[item.reportedId] || 0) + 1;
    return counts;
  }, {});
}

// Plain-English names for codes saved in the database, so admins never read raw codes like "abono".
const named = (names: Record<string, string>, code?: string) => (code && Object.hasOwn(names, code) ? names[code] : undefined);
const readable = (code?: string) => {
  const words = String(code ?? "").replace(/[-_]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "";
};

const CASE_REASONS: Record<string, string> = {
  runner_withdrew: "The runner left the quest",
  requester_cancelled: "The requester cancelled the quest",
  response_timeout: "A reported problem got no reply in 10 minutes",
  requester_suspended: "The requester's account was suspended",
  runner_suspended: "The runner's account was suspended",
  abandoned_no_activity: "No activity for 2 hours",
};

/** Why a quest is waiting for an admin, from the reason saved when it stopped. */
export function caseReason(closedReason?: string) {
  return named(CASE_REASONS, closedReason) ?? "Cancelled or unfinished handover";
}

/** "Runner advances payment (abono)" instead of "abono". */
export function fundingLabel(method?: string) {
  return named(FUNDING_LABELS, method) ?? "Not recorded";
}

const QUEST_STATUSES: Record<string, string> = {
  available: "Open, waiting for a runner",
  accepted: "Accepted",
  in_progress: "In progress",
  settlement: "Waiting for admin (settlement)",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function questStatusLabel(status?: string) {
  return named(QUEST_STATUSES, status) ?? (readable(status) || "Unknown");
}

const CASE_EVENTS: Record<string, string> = {
  post: "Quest posted",
  accept: "Accepted the quest",
  start: "Started the work",
  "request-completion": "Marked the work as done",
  complete: "Confirmed the quest is complete",
  "complete-by-qr": "Confirmed handover by QR scan",
  cancel: "Cancelled the quest",
  "request-cancellation": "Asked to cancel",
  "approve-cancellation": "Agreed to cancel",
  "decline-cancellation": "Declined to cancel",
  "withdraw-cancellation": "Took back the cancel request",
  leave: "Left the quest",
  "open-issue": "Reported a problem",
  "withdraw-issue": "Took back the problem report",
  "escalate-issue": "Sent to admin: no reply in 10 minutes",
  "confirm-vendor-payment": "Paid the vendor",
  "record-expense": "Recorded the cost",
  "approve-expense": "Approved the cost",
  commit: "Committed to buy or collect",
  "record-receipt": "Recorded the receipt",
  "acknowledge-payment": "Confirmed getting paid",
  "confirm-settlement": "Confirmed it's settled",
  "admin-resolution": "Closed the case",
  "account-suspended": "Suspended an account",
  abandoned: "Closed: no activity for 2 hours",
  expire: "Expired with no runner",
  "post-replacement": "Posted as a replacement quest",
  repost: "Reposted as a new quest",
};

/** A readable name for one step in a quest's activity timeline. */
export function caseEventLabel(action?: string) {
  return named(CASE_EVENTS, action) ?? (readable(action) || "Activity");
}