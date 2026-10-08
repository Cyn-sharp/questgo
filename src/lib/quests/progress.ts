type ProgressQuest = { status: string; completionRequestedAt?: unknown; cancellationRequestedBy?: string };

export function questUpdate(before: ProgressQuest, after: ProgressQuest, requester: boolean) {
  if (before.status !== after.status) {
    if (after.status === "accepted") return requester ? "Your quest was accepted! Open chat to arrange the details." : "Quest accepted! Message the requester before you start.";
    if (after.status === "in_progress") return requester ? "Your runner has started the quest." : "You're on your way! Keep the requester updated.";
    if (after.status === "completed") return "Quest completed. Thank you for using QuestGo!";
    if (after.status === "cancelled") return "Quest cancelled. You can check the details in My Quests.";
  }
  if (!before.cancellationRequestedBy && after.cancellationRequestedBy) return "Cancellation requested. Open the quest to respond.";
  if (before.cancellationRequestedBy && !after.cancellationRequestedBy) return "Cancellation request closed. The quest can continue.";
  if (!before.completionRequestedAt && after.completionRequestedAt) return requester ? "Your quest is ready! Check your item and confirm receipt and payment." : "Work marked ready. Waiting for the requester to confirm.";
  return null;
}

export function questNextStep(quest: ProgressQuest, requester: boolean) {
  if (quest.status === "cancelled") return "This quest was cancelled. Your conversation is saved for reference.";
  if (quest.status === "completed") return "All done! Your conversation is saved for reference.";
  if (quest.status === "expired") return "No runner accepted in time. You can post a new quest.";
  if (quest.cancellationRequestedBy) return "Discuss cancellation in chat, then agree, decline, or withdraw the request below.";
  if (quest.status === "available") return requester ? "Waiting for a runner. Chat opens once someone accepts your quest." : "Check the task, reward, and locations. Accept only if you can do this quest.";
  if (quest.status === "accepted") return requester ? "Your runner has accepted. Open chat to confirm the pickup and meeting details." : "Message the requester to confirm the details, then tap Start Quest.";
  if (quest.completionRequestedAt) return requester ? "Check that you received the item or service, pay the runner, then confirm below." : "The requester needs to confirm receipt and payment. You can still chat while waiting.";
  return requester ? "Your runner is working on the quest. Use chat for updates and wait until they mark it ready." : "Complete the task and arrange the handover in chat. Tap Mark Work Ready when it is ready.";
}
