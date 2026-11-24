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

// A recipient inbox entry: the latest message they received and, once they open
// the chat, the id of the message they last read (stored in Firestore so it
// follows the account across devices).
export type InboxEntry = { questId: string; messageId: string; readMessageId?: string };

// Read markers kept in localStorage before read state moved to Firestore still
// count, so existing conversations do not light up again after the upgrade.
export function isUnread(entry: InboxEntry, legacySeen: Record<string, string> = {}) {
  return entry.readMessageId !== entry.messageId && legacySeen[entry.questId] !== entry.messageId;
}

export function unreadQuestIds(inbox: InboxEntry[], visibleQuestIds: Iterable<string>, legacySeen: Record<string, string> = {}) {
  const visible = new Set(visibleQuestIds);
  return new Set(inbox.filter((entry) => visible.has(entry.questId) && isUnread(entry, legacySeen)).map((entry) => entry.questId));
}

// Accessible name for a navigation link that carries an unread badge.
export function unreadLabel(label: string, count: number) {
  return count > 0 ? `${label}, ${count} unread ${count === 1 ? "conversation" : "conversations"}` : label;
}
