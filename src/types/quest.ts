export type QuestStatus =
  | "available"
  | "accepted"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled"
  | "settlement";

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

  workflowVersion?: number;
  fundingMethod?: import("@/lib/quests/funding").FundingMethod;
  purchaseBudget?: number;
  vendorInstructions?: string;
  vendorPaymentConfirmedAt?: unknown;
  committedAt?: unknown;
  paymentReceivedAt?: unknown;
  receiptConfirmedAt?: unknown;
  receiptRecordedAt?: unknown;
  actualExpense?: number;
  expenseEvidence?: string;
  expenseApproved?: boolean;
  issueReason?: string;
  issueRequestedBy?: string;
  issueDeadline?: unknown;
  settlementConfirmedBy?: string[];
  reviewRequestedAt?: unknown;
  resolutionNote?: string;
  replacementQuestId?: string;
  closedReason?: string;
  status: QuestStatus;

  createdAt: unknown;
  expiresAt: unknown;

  acceptedAt?: unknown;
  completedAt?: unknown;
  cancelledAt?: unknown;
  updatedAt?: unknown;
}
