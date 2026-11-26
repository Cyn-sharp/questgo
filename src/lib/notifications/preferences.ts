import { QUEST_CATEGORIES } from "../quests/policy.ts";

// Stored at users/{uid}/preferences/notifications so the choice follows the
// account to every device. The rules accept exactly these fields.
export type NotificationPrefs = {
  messages: boolean;
  questUpdates: boolean;
  newQuests: boolean;
  // Empty means every category.
  newQuestCategories: string[];
};

export type AlertKind = "message" | "questUpdate" | "newQuest";

export const NOTIFICATION_CATEGORIES = QUEST_CATEGORIES;

// Chat and status alerts are about the user's own quests, so they start on.
// Marketplace alerts could be noisy on a busy campus, so they start off.
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = Object.freeze({
  messages: true,
  questUpdates: true,
  newQuests: false,
  newQuestCategories: [],
}) as NotificationPrefs;

// Accept whatever is stored and fall back to the defaults field by field.
export function parsePrefs(data: unknown): NotificationPrefs {
  const value = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
  const flag = (key: "messages" | "questUpdates" | "newQuests") =>
    typeof value[key] === "boolean" ? value[key] as boolean : DEFAULT_NOTIFICATION_PREFS[key];
  const categories = Array.isArray(value.newQuestCategories)
    ? [...new Set(value.newQuestCategories.filter((item): item is string => NOTIFICATION_CATEGORIES.includes(item as string)))]
    : [];
  return { messages: flag("messages"), questUpdates: flag("questUpdates"), newQuests: flag("newQuests"), newQuestCategories: categories };
}

export function alertEnabled(prefs: NotificationPrefs, kind: AlertKind) {
  return kind === "message" ? prefs.messages : kind === "questUpdate" ? prefs.questUpdates : prefs.newQuests;
}

export function toggleCategory(prefs: NotificationPrefs, category: string): NotificationPrefs {
  const selected = prefs.newQuestCategories.includes(category)
    ? prefs.newQuestCategories.filter((item) => item !== category)
    : [...prefs.newQuestCategories, category];
  // Choosing every category is the same as choosing none: all of them.
  return { ...prefs, newQuestCategories: selected.length === NOTIFICATION_CATEGORIES.length ? [] : selected };
}

type MarketplaceQuest = { requesterId: string; category: string; status: string; expiresAt?: { toMillis(): number } | null };

// A posted quest is worth an alert only when someone else posted it, it can
// still be accepted, its requester is not blocked, and its category is wanted.
export function wantsNewQuest(quest: MarketplaceQuest, uid: string, prefs: NotificationPrefs, blocked: ReadonlySet<string>, now: number) {
  if (!prefs.newQuests || quest.status !== "available" || quest.requesterId === uid || blocked.has(quest.requesterId)) return false;
  if (quest.expiresAt && quest.expiresAt.toMillis() <= now) return false;
  return !prefs.newQuestCategories.length || prefs.newQuestCategories.includes(quest.category);
}

export function newQuestText(quest: { title: string; category: string; reward?: number }) {
  const reward = typeof quest.reward === "number" && quest.reward > 0 ? ` · ₱${quest.reward}` : "";
  return `New ${quest.category} quest: “${quest.title}”${reward}`;
}
