import test from "node:test";
import assert from "node:assert/strict";
import { selectConversations, conversationPriority } from "../src/lib/quests/conversations.ts";

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
