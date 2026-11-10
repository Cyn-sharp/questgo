import { QuestError } from "./policy.ts";

// Live location is shared only by the assigned runner, and only while the
// quest is underway. Leaving these statuses deletes the stored position.
export const TRACKING_STATUSES = ["accepted", "in_progress"];
export const MIN_LOCATION_INTERVAL_MS = 5000;
export const STALE_LOCATION_MS = 2 * 60 * 1000;

type TrackedQuest = { status: string; questRunnerId?: string | null };

export function canShareLocation(quest: TrackedQuest, uid: string) {
  return quest.questRunnerId === uid && TRACKING_STATUSES.includes(quest.status);
}

export function validateLocation(input: Record<string, unknown>) {
  const { lat, lng, accuracy } = input;
  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) throw new QuestError("Invalid latitude.");
  if (typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180) throw new QuestError("Invalid longitude.");
  const meters = typeof accuracy === "number" && Number.isFinite(accuracy) ? Math.min(Math.max(accuracy, 0), 5000) : 0;
  // ~1 m precision is plenty and avoids storing more detail than needed.
  const round = (value: number) => Math.round(value * 1e5) / 1e5;
  return { lat: round(lat), lng: round(lng), accuracy: Math.round(meters) };
}
