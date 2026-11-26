import test from "node:test";
import assert from "node:assert/strict";
import { ALERT_LIMIT, ALERT_MAX_AGE_MS, addAlert, alertId, markAllRead, parseAlerts, timeAgo, unreadAlerts } from "../src/lib/notifications/history.ts";

const record = (text, at, read = false) => ({ id: alertId("questUpdate", "/quests/active?id=q", text), kind: "questUpdate", text, href: "/quests/active?id=q", at, read });

test("new alerts go first and the list stays within its limit", () => {
  let list = [];
  for (let i = 0; i < ALERT_LIMIT + 5; i++) list = addAlert(list, record(`update ${i}`, 1000 + i));
  assert.equal(list.length, ALERT_LIMIT);
  assert.equal(list[0].text, `update ${ALERT_LIMIT + 4}`);
});

test("the same alert from two tabs is kept once, but a later repeat is kept", () => {
  let list = addAlert([], record("Quest accepted", 0));
  list = addAlert(list, record("Quest accepted", 30_000));
  assert.equal(list.length, 1);
  list = addAlert(list, record("Quest accepted", 10 * 60_000));
  assert.equal(list.length, 2);
});

test("alerts older than three days are dropped", () => {
  const list = addAlert([record("old", 0)], record("new", ALERT_MAX_AGE_MS + 1));
  assert.deepEqual(list.map((item) => item.text), ["new"]);
});

test("unread count and mark all read", () => {
  const list = [record("a", 2), record("b", 1, true)];
  assert.equal(unreadAlerts(list), 1);
  const read = markAllRead(list);
  assert.equal(unreadAlerts(read), 0);
  assert.equal(unreadAlerts(list), 1, "original list is not changed");
});

test("stored alerts are validated, sorted and pruned", () => {
  const now = 1_000;
  const stored = JSON.stringify([record("older", 500), record("newer", 900), { ...record("bad link", 950), href: "https://evil.example" },
    { text: "missing fields" }, record("expired", now - ALERT_MAX_AGE_MS), null]);
  assert.deepEqual(parseAlerts(stored, now).map((item) => item.text), ["newer", "older"]);
  assert.deepEqual(parseAlerts("not json", now), []);
  assert.deepEqual(parseAlerts(JSON.stringify({ a: 1 }), now), []);
  assert.deepEqual(parseAlerts(null, now), []);
});

test("relative times read naturally", () => {
  const min = 60_000;
  assert.equal(timeAgo(0, 20_000), "Just now");
  assert.equal(timeAgo(0, 5 * min), "5 min ago");
  assert.equal(timeAgo(0, 3 * 60 * min), "3 hr ago");
  assert.equal(timeAgo(0, 26 * 60 * min), "Yesterday");
  assert.equal(timeAgo(0, 50 * 60 * min), "2 days ago");
});
