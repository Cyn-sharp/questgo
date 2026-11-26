import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";

export type AuditActor = { uid: string; name: string };
export type AuditTarget = { type: "report" | "quest" | "user"; id: string };

const clip = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

// Plain data for one audit record. Kept pure so the shape and limits can be unit tested.
export function auditEntry(actor: AuditActor, action: string, target: AuditTarget, details = "") {
  return { actorId: clip(actor.uid, 128), actorName: clip(actor.name, 100) || "Administrator", action: clip(action, 60), targetType: target.type, targetId: clip(target.id, 260), details: clip(details, 500) };
}

// Append-only record of administrator decisions. Server-only: Firestore rules deny client access.
export function auditService(db: Firestore) {
  return {
    // Inside a transaction so the record exists if and only if the decision was saved.
    inTransaction(tx: Transaction, actor: AuditActor, action: string, target: AuditTarget, details = "") {
      tx.create(db.collection("auditLog").doc(), { ...auditEntry(actor, action, target, details), createdAt: FieldValue.serverTimestamp() });
    },
    async record(actor: AuditActor, action: string, target: AuditTarget, details = "") {
      await db.collection("auditLog").add({ ...auditEntry(actor, action, target, details), createdAt: FieldValue.serverTimestamp() });
    },
    async recent(limit = 100) {
      const records = await db.collection("auditLog").orderBy("createdAt", "desc").limit(Math.min(limit, 200)).get();
      return records.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate().toISOString() ?? null }));
    },
  };
}
