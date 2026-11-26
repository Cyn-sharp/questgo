export type AdminCaseRow = { id: string; title?: string; issueReason?: string; requesterName?: string; runnerName?: string; actualExpense?: number; fundingMethod?: string; createdAt?: string | null };
export type AdminReportRow = { id: string; questId: string; questTitle?: string; reporterName?: string; reportedName?: string; reportedId: string; reason?: string; details?: string; createdAt?: string | null };

function includesQuery(values: Array<string | undefined>, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  return !normalized || values.some((value) => value?.toLocaleLowerCase().includes(normalized));
}

export function filterCases<T extends AdminCaseRow>(items: T[], search: string, funding: string) {
  return items.filter((item) => includesQuery([item.title, item.requesterName, item.runnerName, item.issueReason], search) && (funding === "all" || item.fundingMethod === funding));
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
