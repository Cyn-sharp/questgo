// The bell's list of recent alerts. Kept in this browser only, for a few days.

export type AlertRecord = {
  id: string;
  kind: "questUpdate" | "newQuest";
  text: string;
  href: string;
  at: number;
  read: boolean;
};

export const ALERT_LIMIT = 30;
export const ALERT_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;
// Two open tabs see the same quest change; treat repeats this close together as one.
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export function alertId(kind: AlertRecord["kind"], href: string, text: string) {
  return `${kind}|${href}|${text}`;
}

// Newest first, without expired, duplicate or excess records.
export function addAlert(list: readonly AlertRecord[], record: AlertRecord, now = record.at): AlertRecord[] {
  const fresh = prune(list, now);
  if (fresh.some((item) => item.id === record.id && Math.abs(item.at - record.at) < DUPLICATE_WINDOW_MS)) return fresh;
  return [record, ...fresh].slice(0, ALERT_LIMIT);
}

export function prune(list: readonly AlertRecord[], now: number): AlertRecord[] {
  return list.filter((item) => now - item.at < ALERT_MAX_AGE_MS).slice(0, ALERT_LIMIT);
}

export function unreadAlerts(list: readonly AlertRecord[]) {
  return list.filter((item) => !item.read).length;
}

export function markAllRead(list: readonly AlertRecord[]): AlertRecord[] {
  return list.some((item) => !item.read) ? list.map((item) => item.read ? item : { ...item, read: true }) : [...list];
}

// Stored data comes from the browser and may be old or edited; keep only valid records.
export function parseAlerts(raw: string | null, now: number): AlertRecord[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    const valid = value.filter((item): item is AlertRecord => Boolean(item) && typeof item === "object"
      && typeof item.id === "string" && (item.kind === "questUpdate" || item.kind === "newQuest")
      && typeof item.text === "string" && typeof item.href === "string" && item.href.startsWith("/")
      && typeof item.at === "number" && typeof item.read === "boolean");
    return prune(valid.sort((a, b) => b.at - a.at), now);
  } catch {
    return [];
  }
}

export function timeAgo(at: number, now: number) {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}
