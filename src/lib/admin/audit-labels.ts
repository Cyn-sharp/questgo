// Plain-English names for the audit log, so admins never read raw codes like "report-suspended".

export type AuditTone = "neutral" | "warning" | "danger" | "success";
export type AuditFilter = "all" | "ids" | "reports" | "settlements";

const ACTIONS: Record<string, { label: string; tone: AuditTone }> = {
  "id-approved": { label: "ID approved", tone: "success" },
  "id-rejected": { label: "ID rejected", tone: "warning" },
  "report-dismissed": { label: "Report dismissed", tone: "neutral" },
  "report-warned": { label: "Warning recorded", tone: "warning" },
  "report-suspended": { label: "Account suspended", tone: "danger" },
  "quests-closed-on-suspension": { label: "Quests closed after suspension", tone: "neutral" },
  "settlement-resolved": { label: "Settlement resolved", tone: "success" },
  // Older entries, from before runner applications were removed.
  "runner-approved": { label: "Runner approved (old)", tone: "neutral" },
  "runner-rejected": { label: "Runner declined (old)", tone: "neutral" },
};

export const AUDIT_FILTERS: { id: AuditFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ids", label: "ID checks" },
  { id: "reports", label: "Reports" },
  { id: "settlements", label: "Settlements" },
];

/** A readable name and a color for an audit action. Unknown actions still read well. */
export function describeAuditAction(action: string): { label: string; tone: AuditTone } {
  const known = ACTIONS[action];
  if (known) return known;
  const words = String(action ?? "").replace(/[-_]+/g, " ").trim();
  return { label: words ? words[0].toUpperCase() + words.slice(1) : "Admin action", tone: "neutral" };
}

/** Which filter an action belongs to. */
export function auditCategory(action: string): Exclude<AuditFilter, "all"> | "other" {
  const value = String(action ?? "");
  if (value.startsWith("id-")) return "ids";
  if (value.startsWith("report-") || value === "quests-closed-on-suspension") return "reports";
  if (value.startsWith("settlement-")) return "settlements";
  return "other";
}

const TARGETS: Record<string, string> = { user: "Student", quest: "Quest", report: "Report" };

/** "Student qPAHWATT…" instead of a long raw ID. */
export function auditTarget(type: string, id: string) {
  const name = TARGETS[type] ?? "Item";
  const value = String(id ?? "");
  const short = value.length > 10 ? `${value.slice(0, 8)}…` : value;
  return short ? `${name} ${short}` : name;
}