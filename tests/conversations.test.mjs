import test from "node:test";
import assert from "node:assert/strict";
import { selectConversations, conversationPriority, isUnread, unreadQuestIds, unreadLabel } from "../src/lib/quests/conversations.ts";

test("ongoing conversations take priority and only three latest closed transactions remain", () => {
  const quest = (id, status, time) => ({ id, status, questRunnerId: "runner", updatedAt: { toMillis: () => time } });
  const current = quest("working", "in_progress", 1);
  const { active, closed } = selectConversations([
    quest("accepted", "accepted", 100), current, current,
    ...[1, 2, 3, 4].map((i) => quest(String(i), i === 4 ? "cancelled" : "completed", i)),
    { id: "unclaimed", status: "cancelled" },
  ]);
  assert.deepEqual(active.map((item) => item.id), ["working", "accepted"]);
  assert.deepEqual(closed.map((item) => item.id), ["4", "3", "2"]);
  assert.ok(conversationPriority("in_progress") < conversationPriority("completed"));
});

test("a conversation is unread until its latest message is marked read", () => {
  assert.equal(isUnread({ questId: "q", messageId: "m1" }), true);
  assert.equal(isUnread({ questId: "q", messageId: "m1", readMessageId: "m1" }), false);
  // A newer message replaces messageId, so an older read marker no longer counts.
  assert.equal(isUnread({ questId: "q", messageId: "m2", readMessageId: "m1" }), true);
  // Read markers kept in this browser before the Firestore read state still count.
  assert.equal(isUnread({ questId: "q", messageId: "m1" }, { q: "m1" }), false);
  assert.equal(isUnread({ questId: "q", messageId: "m2" }, { q: "m1" }), true);
});

test("unread badges count only conversations the user can see", () => {
  const inbox = [
    { questId: "open", messageId: "a" },
    { questId: "read", messageId: "b", readMessageId: "b" },
    { questId: "old-closed", messageId: "c" },
  ];
  assert.deepEqual([...unreadQuestIds(inbox, ["open", "read"])], ["open"]);
  assert.equal(unreadQuestIds([], ["open"]).size, 0);
  assert.equal(unreadLabel("My Quests", 0), "My Quests");
  assert.equal(unreadLabel("My Quests", 1), "My Quests, 1 unread conversation");
  assert.equal(unreadLabel("My Quests", 3), "My Quests, 3 unread conversations");
});
