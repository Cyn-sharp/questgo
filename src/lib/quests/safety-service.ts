import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import { QuestError, type WorkflowQuest } from "./policy";
import type { auditService } from "./audit";
import { reportId, reportTarget, validateReport, validateResolution } from "./safety";

export function safetyService(db: Firestore, audit?: Pick<ReturnType<typeof auditService>, "inTransaction">) {
  const blockRef = (uid: string, targetId: string) => db.doc(`users/${uid}/blocks/${targetId}`);

  return {
    async report(uid: string, name: string, questId: string, input: Record<string, unknown>) {
      const { reason, details } = validateReport(input);
      const questRef = db.collection("quests").doc(questId);
      const ref = db.collection("reports").doc(reportId(questId, uid));
      await db.runTransaction(async (tx) => {
        const [snapshot, existing] = await Promise.all([tx.get(questRef), tx.get(ref)]);
        if (!snapshot.exists) throw new QuestError("Quest not found.", 404);
        if (existing.exists) throw new QuestError("You already reported this quest. An administrator will review it.", 409);
        const quest = snapshot.data() as WorkflowQuest & { title?: string; requesterName?: string; runnerName?: string };
        const reportedId = reportTarget(quest, uid);
        const reportedName = reportedId === quest.requesterId ? quest.requesterName : quest.runnerName;
        tx.create(ref, {
          questId, questTitle: quest.title ?? "", reporterId: uid, reporterName: name, reportedId,
          reportedName: reportedName || "QuestGo User", reason, details, status: "open", createdAt: FieldValue.serverTimestamp(),
        });
        if (input.block === true) tx.set(blockRef(uid, reportedId), { blockedId: reportedId, blockedName: reportedName || "QuestGo User", createdAt: FieldValue.serverTimestamp() });
      });
      return ref.id;
    },
    async block(uid: string, targetId: string, targetName: string) {
      await blockRef(uid, targetId).set({ blockedId: targetId, blockedName: targetName, createdAt: FieldValue.serverTimestamp() });
    },
    async unblock(uid: string, targetId: string) {
      await blockRef(uid, targetId).delete();
    },
    // Used inside the accept transaction, so it must run before any writes.
    async eitherBlocked(tx: Transaction, a: string, b: string) {
      const [ab, ba] = await Promise.all([tx.get(blockRef(a, b)), tx.get(blockRef(b, a))]);
      return ab.exists || ba.exists;
    },
    async openReports() {
      // Sorted here instead of in the query to avoid needing a composite index.
      const records = await db.collection("reports").where("status", "==", "open").limit(100).get();
      return records.docs
        .map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate().toISOString() ?? null }))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    },
    async resolve(adminId: string, adminName: string, id: string, input: Record<string, unknown>) {
      const { outcome, note } = validateResolution(input);
      const ref = db.collection("reports").doc(id);
      return db.runTransaction(async (tx) => {
        const report = (await tx.get(ref)).data();
        if (!report || report.status !== "open") throw new QuestError("This report is no longer open.", 409);
        if (outcome === "suspended" && report.reportedId === adminId) throw new QuestError("You cannot suspend your own account.");
        tx.update(ref, { status: "resolved", outcome, resolutionNote: note, resolvedBy: adminId, resolvedByName: adminName, resolvedAt: FieldValue.serverTimestamp() });
        audit?.inTransaction(tx, { uid: adminId, name: adminName }, `report-${outcome}`, { type: "report", id }, `Reported user ${report.reportedId}: ${note}`);
        return { outcome, reportedId: String(report.reportedId) };
      });
    },
    // After a suspension, the student's other open reports are closed too: the account is already suspended.
    // Each one is re-checked first, so a report another admin just decided is left alone.
    async closeOtherReports(adminId: string, adminName: string, reportedId: string, sourceId: string) {
      const open = await db.collection("reports").where("reportedId", "==", reportedId).where("status", "==", "open").limit(100).get();
      const closed: string[] = [];
      for (const doc of open.docs) {
        if (doc.id === sourceId) continue;
        const done = await db.runTransaction(async (tx) => {
          const report = (await tx.get(doc.ref)).data();
          if (!report || report.status !== "open") return false;
          tx.update(doc.ref, { status: "resolved", outcome: "suspended", resolutionNote: "Closed automatically: this account was suspended from another report.", resolvedBy: adminId, resolvedByName: adminName, resolvedAt: FieldValue.serverTimestamp(), closedWithReport: sourceId });
          return true;
        });
        if (done) closed.push(doc.id);
      }
      return closed;
    },
  };
}