export type QuestStatus = "open" | "accepted" | "completed" | "expired";

export type Quest = {
  id: string;
  title: string;
  category: string;
  rewardPhp: number;
  location: string;
  status: QuestStatus;
  expiresAt: string;
};