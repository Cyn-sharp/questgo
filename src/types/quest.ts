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
  attachment?: { path: string; name: string; size: number; contentType: string };
  requirements?: Record<string, string>;

  requesterId: string;
  questRunnerId?: string;
  requesterName?: string;
  runnerName?: string;
  completionRequestedAt?: unknown;
  cancellationRequestedBy?: string;
  cancellationRequestedAt?: unknown;

  status: QuestStatus;

  createdAt: unknown;
  expiresAt: unknown;

  acceptedAt?: unknown;
  completedAt?: unknown;
  cancelledAt?: unknown;
  updatedAt?: unknown;
}
