import test from "node:test";
import assert from "node:assert/strict";
import { filterCases, filterReports, formatAge, repeatReportCounts, sortByAge, sortByAmount } from "../src/lib/admin/presentation.ts";

test("case search and funding filters combine without mutating source rows", () => {
  const rows = [{ title: "Print notes", requesterName: "Alex", fundingMethod: "prepaid" }, { title: "Pick up keys", requesterName: "Sam", fundingMethod: "no_purchase" }];
  assert.deepEqual(filterCases(rows, "alex", "prepaid"), [rows[0]]);
  assert.equal(filterCases(rows, "", "all").length, 2);
  assert.equal(rows.length, 2);
});

test("report search and selected outcome filters work together", () => {
  const rows = [{ id: "a", questId: "q1", questTitle: "Library pickup", reportedId: "u1", reportedName: "Sam" }, { id: "b", questId: "q2", questTitle: "Print job", reportedId: "u2", reportedName: "Lee" }];
  assert.deepEqual(filterReports(rows, "sam", "warned", { a: "warned" }), [rows[0]]);
  assert.deepEqual(filterReports(rows, "", "unassigned", { a: "warned" }), [rows[1]]);
});

test("age formatting handles missing and valid timestamps", () => {
  assert.equal(formatAge(undefined, 0), "Age unavailable");
  assert.equal(formatAge(new Date(0).toISOString(), 90 * 60_000), "1h ago");
});

test("age and amount sort keep unknown ages last and report repeat counts", () => {
  const rows = [{ id: "old", createdAt: "2025-01-01", actualExpense: 40, reportedId: "u1" }, { id: "new", createdAt: "2026-01-01", actualExpense: 10, reportedId: "u1" }, { id: "unknown", actualExpense: 30, reportedId: "u2" }];
  assert.deepEqual(sortByAge(rows, "newest").map((row) => row.id), ["new", "old", "unknown"]);
  assert.deepEqual(sortByAmount(rows, "high").map((row) => row.id), ["old", "unknown", "new"]);
  assert.deepEqual(repeatReportCounts(rows).u1, 2);
});
