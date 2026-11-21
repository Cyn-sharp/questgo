import test from "node:test";
import assert from "node:assert/strict";
import { mergeMessages, mayHaveOlder, LIVE_LIMIT } from "../src/lib/quests/messagePaging.ts";

const msg = (id, ms) => ({ id, createdAt: ms === undefined ? undefined : { toMillis: () => ms } });

test("merge is chronological, deduplicated and gap-free across live and older pages", () => {
  const live = [msg("c", 30), msg("d", 40)];
  const older = [msg("a", 10), msg("b", 20), msg("c", 30)]; // overlap on c
  assert.deepEqual(mergeMessages(live, older).map((m) => m.id), ["a", "b", "c", "d"]);
});

test("messages pushed out of the live window are retained; ties break by id; pending sorts last", () => {
  let all = mergeMessages([], [msg("a", 1), msg("b", 2)]);
  all = mergeMessages(all, [msg("b", 2), msg("c", 3)]); // live window moved, a dropped out of it
  assert.deepEqual(all.map((m) => m.id), ["a", "b", "c"]);
  assert.deepEqual(mergeMessages([msg("z", 5), msg("y", 5)], [msg("p")]).map((m) => m.id), ["y", "z", "p"]);
});

test("older control hides once a short page arrives", () => {
  assert.equal(mayHaveOlder(LIVE_LIMIT, LIVE_LIMIT), true);
  assert.equal(mayHaveOlder(LIVE_LIMIT - 1, LIVE_LIMIT), false);
  assert.equal(mayHaveOlder(0, 50), false);
});
