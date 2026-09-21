export type QuestStatus =
  | "available"
  | "accepted"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled";

export interface Quest {
  id: string;

  title: string;
  category: string;
  description: string;

  reward: number;

  location: string;
  meetUpPoint: string;

  preferredTime: string;
  estimatedCompletionTime?: string;
  neededBy?: string;

  attachmentUrl?: string;

  requesterId: string;
  questRunnerId?: string;

  status: QuestStatus;

  createdAt: unknown;
  expiresAt: unknown;

  acceptedAt?: unknown;
  completedAt?: unknown;
}