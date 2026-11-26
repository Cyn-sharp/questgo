import assert from "node:assert/strict";
import test from "node:test";
import { AUDIT_FILTERS, auditCategory, auditTarget, describeAuditAction } from "../src/lib/admin/audit-labels.ts";

test("every action the app records has a plain-English name", () => {
  for (const action of ["id-approved", "id-rejected", "report-dismissed", "report-warned", "report-suspended", "quests-closed-on-suspension", "settlement-resolved"]) {
    const { label } = describeAuditAction(action);
    assert.ok(label && !label.includes("-"), `${action} -> ${label}`);
  }
  assert.deepEqual(describeAuditAction("report-suspended"), { label: "Account suspended", tone: "danger" });
  assert.deepEqual(describeAuditAction("id-approved"), { label: "ID approved", tone: "success" });
});

test("unknown actions still read well", () => {
  assert.deepEqual(describeAuditAction("quest-reopened_by-admin"), { label: "Quest reopened by admin", tone: "neutral" });
  assert.deepEqual(describeAuditAction(""), { label: "Admin action", tone: "neutral" });
});

test("filters group the actions", () => {
  assert.equal(auditCategory("id-rejected"), "ids");
  assert.equal(auditCategory("report-warned"), "reports");
  assert.equal(auditCategory("quests-closed-on-suspension"), "reports");
  assert.equal(auditCategory("settlement-resolved"), "settlements");
  assert.equal(auditCategory("runner-approved"), "other");
  assert.deepEqual(AUDIT_FILTERS.map((option) => option.id), ["all", "ids", "reports", "settlements"]);
});

test("targets show a short ID with a readable name", () => {
  assert.equal(auditTarget("user", "qPAHWATTBOdMGdoVo7hlfBYHbGt1"), "Student qPAHWATT…");
  assert.equal(auditTarget("quest", "abc123"), "Quest abc123");
  assert.equal(auditTarget("mystery", ""), "Item");
});