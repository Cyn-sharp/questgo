export class QuestError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export const QUEST_CATEGORIES = ["Printing", "Pickup", "Delivery", "Shopping", "Other"];
export const QUEST_WINDOW_MS = 30 * 60 * 1000;

export function validateQuest(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new QuestError("Invalid quest.");
  const data = input as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const value = data[key];
    if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
      throw new QuestError(`Please provide a valid ${key} (up to ${max} characters).`);
    }
    return value.trim();
  };
  const category = text("category", 30);
  if (!QUEST_CATEGORIES.includes(category)) throw new QuestError("Invalid category.");
  if (typeof data.reward !== "number" || !Number.isFinite(data.reward) || data.reward <= 0 || data.reward > 10000 || Math.abs(Math.round(data.reward * 100) - data.reward * 100) > 0.00001) {
    throw new QuestError("Reward must be between ₱0.01 and ₱10,000, with at most two decimal places.");
  }
  // Whitelist fields: identities, status, attachments and timestamps are never client supplied.
  return { title: text("title", 120), category, description: text("description", 3000), reward: data.reward,
    location: text("location", 200), meetUpPoint: text("meetUpPoint", 200), preferredTime: text("preferredTime", 100) };
}

export type WorkflowQuest = {
  requesterId: string;
  questRunnerId?: string;
  status: string;
  expiresAt?: { toMillis(): number };
  completionRequestedAt?: unknown;
};

export function isActiveQuest(quest: WorkflowQuest, now: number) {
  return quest.status === "accepted" || quest.status === "in_progress" ||
    (quest.status === "available" && (!quest.expiresAt || quest.expiresAt.toMillis() > now));
}

export function transitionQuest(quest: WorkflowQuest, uid: string, action: string, now: number) {
  if (action === "accept") {
    if (quest.requesterId === uid) throw new QuestError("You cannot accept your own quest.", 403);
    if (quest.status !== "available" || quest.questRunnerId) throw new QuestError("Another runner has already accepted this quest, or it is no longer available.", 409);
    if (!quest.expiresAt || quest.expiresAt.toMillis() <= now) throw new QuestError("This quest has expired.", 409);
    return "accepted";
  }
  if (action === "cancel" && quest.requesterId === uid && quest.status === "available") return "cancelled";
  if (action === "start" && quest.questRunnerId === uid && quest.status === "accepted") return "in_progress";
  if (action === "request-completion" && quest.questRunnerId === uid && quest.status === "in_progress" && !quest.completionRequestedAt) return "in_progress";
  if (action === "complete" && quest.requesterId === uid && quest.status === "in_progress" && quest.completionRequestedAt) return "completed";
  throw new QuestError("You cannot perform this action at the current quest stage.", 403);
}

export function canMessage(quest: WorkflowQuest, uid: string) {
  return ["accepted", "in_progress"].includes(quest.status) &&
    (quest.requesterId === uid || quest.questRunnerId === uid);
}
