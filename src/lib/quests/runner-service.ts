import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { QuestError } from "./policy";
import type { auditService } from "./audit";
import { validateApplication, validateRunnerDecision, type RunnerStatus } from "./runner";

// One document per applicant, keyed by uid. Server-only: Firestore rules deny client access,
// and the quest service reads it inside the accept transaction.
export function runnerService(db: Firestore, audit: Pick<ReturnType<typeof auditService>, "inTransaction">) {
  const ref = (uid: string) => db.doc(`runnerApplications/${uid}`);
  return {
    async mine(uid: string): Promise<{ status: RunnerStatus; reviewNote?: string; submittedAt?: string }> {
      const snapshot = await ref(uid).get();
      if (!snapshot.exists) return { status: "none" };
      const data = snapshot.data() as { status: RunnerStatus; reviewNote?: string; createdAt?: { toDate(): Date } };
      const submittedAt = data.createdAt?.toDate().toISOString();
      return { status: data.status, ...(submittedAt ? { submittedAt } : {}), ...(data.status === "rejected" && data.reviewNote ? { reviewNote: data.reviewNote } : {}) };
    },
    async apply(uid: string, name: string, email: string | undefined, input: unknown) {
      const application = validateApplication(input);
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(ref(uid));
        const status = existing.data()?.status;
        if (status === "pending") throw new QuestError("Your application is already being reviewed.", 409);
        if (status === "approved") throw new QuestError("You are already a Verified Runner.", 409);
        tx.set(ref(uid), { uid, name, email: email ?? "", ...application, status: "pending", createdAt: FieldValue.serverTimestamp() });
      });
    },
    async pending(limit = 100) {
      const snapshot = await db.collection("runnerApplications").where("status", "==", "pending").limit(Math.min(limit, 200)).get();
      return snapshot.docs
        .map((d) => { const x = d.data(); return { uid: d.id, name: String(x.name ?? ""), email: String(x.email ?? ""), availability: String(x.availability ?? ""), termsVersion: String(x.termsVersion ?? ""), createdAt: x.createdAt?.toDate().toISOString() ?? null }; })
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    },
    async decide(admin: { uid: string; name: string }, targetUid: string, input: unknown) {
      const { outcome, note } = validateRunnerDecision(input);
      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref(targetUid));
        if (!snapshot.exists) throw new QuestError("Application not found.", 404);
        if (snapshot.data()?.status !== "pending") throw new QuestError("This application was already decided.", 409);
        tx.update(ref(targetUid), { status: outcome === "approve" ? "approved" : "rejected", reviewNote: note, reviewedBy: admin.uid, reviewedAt: FieldValue.serverTimestamp() });
        audit.inTransaction(tx, admin, outcome === "approve" ? "runner-approved" : "runner-rejected", { type: "user", id: targetUid }, note);
      });
    },
  };
}
