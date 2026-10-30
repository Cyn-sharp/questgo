type ConversationQuest = { id: string; status: string; questRunnerId?: string; updatedAt?: unknown; completedAt?: unknown; cancelledAt?: unknown; createdAt?: unknown };
export function timestampMillis(value: unknown): number {
  return value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function" ? value.toMillis() : 0;
}
export function conversationPriority(status: string) {
  return status === "in_progress" ? 0 : status === "accepted" ? 1 : 2;
}
export function selectConversations<T extends ConversationQuest>(quests: T[]) {
  const unique = [...new Map(quests.map((quest) => [quest.id, quest])).values()];
  const recent = (a: T, b: T) => timestampMillis(b.updatedAt ?? b.completedAt ?? b.cancelledAt ?? b.createdAt) - timestampMillis(a.updatedAt ?? a.completedAt ?? a.cancelledAt ?? a.createdAt);
  const active = unique.filter((quest) => ["accepted", "in_progress", "settlement"].includes(quest.status))
    .sort((a, b) => conversationPriority(a.status) - conversationPriority(b.status) || recent(a, b));
  const closed = unique.filter((quest) => quest.questRunnerId && ["completed", "cancelled"].includes(quest.status)).sort(recent).slice(0, 3);
  return { active, closed };
}
