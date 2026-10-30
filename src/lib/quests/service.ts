import { recoveryChanges } from "./recovery";
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { canMessage, isActiveQuest, QuestError, QUEST_WINDOW_MS, transitionQuest, validateQuest, type WorkflowQuest } from "./policy";

export function questService(db: Firestore) {
  return {
    async create(uid: string, name: string, input: unknown, attachment?: { path: string; name: string; size: number; contentType: string }) {
      const data = validateQuest(input, Boolean(attachment));
      const questRef = db.collection("quests").doc();
      const lockRef = db.collection("requesterLocks").doc(uid);
      await db.runTransaction(async (tx) => {
        // Every create for this requester reads/writes the same document.
        // The query also covers quests created before locks were introduced.
        await tx.get(lockRef);
        const existing = await tx.get(db.collection("quests").where("requesterId", "==", uid));
        const now = Timestamp.now();
        if (existing.docs.some((record) => isActiveQuest(record.data() as WorkflowQuest, now.toMillis()))) {
          throw new QuestError("You already have an active quest. Open My Requests to manage it before posting another.", 409);
        }
        tx.create(questRef, { ...data, ...(attachment ? { attachment } : {}), requesterId: uid, requesterName: name, status: "available",
          createdAt: now, expiresAt: Timestamp.fromMillis(now.toMillis() + QUEST_WINDOW_MS) });
        tx.set(lockRef, { questId: questRef.id, updatedAt: now });
        tx.create(questRef.collection("events").doc(), { actorId: uid, actorName: name, action: "post", toStatus: "available", createdAt: now });
      });
      return questRef.id;
    },
    async act(uid: string, name: string, id: string, action: string, input: Record<string, unknown> = {}) {
      const ref = db.collection("quests").doc(id);
      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) throw new QuestError("Quest not found.", 404);
        const quest = snapshot.data() as WorkflowQuest;
        if (quest.cancellationRequestedBy && ["record-expense", "record-receipt", "approve-expense", "commit"].includes(action)) throw new QuestError("Resolve cancellation before committing work.", 409);
        const recovery = recoveryChanges(quest, uid, action, input, Date.now());
        const status = recovery?.status ?? (recovery ? quest.status : transitionQuest(quest, uid, action, Date.now()));
        if (!recovery && (quest as WorkflowQuest & { issueRequestedBy?: string }).issueRequestedBy && !["cancel", "request-cancellation", "approve-cancellation", "decline-cancellation", "withdraw-cancellation"].includes(action)) throw new QuestError("Resolve the issue before continuing.", 409);
        if (action === "accept" && (quest as WorkflowQuest & { fundingMethod?: string }).fundingMethod === "abono" && input.acceptAdvance !== true) throw new QuestError("Confirm that you agree to advance the purchase cost.");
        const funded = quest as WorkflowQuest & { fundingMethod?: string; receiptRecordedAt?: unknown };
        if (action === "request-completion" && funded.fundingMethod === "abono" && !funded.receiptRecordedAt) throw new QuestError("Record the actual purchase cost and receipt details first.", 409);
        if (action === "request-completion" && quest.workflowVersion === 2 && !quest.committedAt) throw new QuestError("Record the purchase or item collection checkpoint before marking work ready.", 409);
        if (action === "complete" && quest.workflowVersion === 2) {
          const payment = quest as WorkflowQuest & { paymentReceivedAt?: unknown };
          if (!payment.paymentReceivedAt || input.receiptConfirmed !== true || input.paymentConfirmed !== true) throw new QuestError("The runner must acknowledge payment, and you must confirm receipt and payment.", 409);
        }
        const changes: Record<string, unknown> = { ...recovery, status, updatedAt: FieldValue.serverTimestamp() };
        if (changes.clearIssue) { delete changes.clearIssue; changes.issueRequestedBy = FieldValue.delete(); changes.issueReason = FieldValue.delete(); changes.issueDeadline = FieldValue.delete(); }
        if (recovery?.deadlineMillis) { changes.issueDeadline = Timestamp.fromMillis(Number(recovery.deadlineMillis)); delete changes.deadlineMillis; }
        for (const [flag, field] of [["receiptRecorded", "receiptRecordedAt"], ["paymentReceived", "paymentReceivedAt"], ["vendorPaid", "vendorPaymentConfirmedAt"], ["committed", "committedAt"], ["review", "reviewRequestedAt"], ["settled", "settledAt"]]) {
          if (changes[flag]) changes[field] = FieldValue.serverTimestamp();
          delete changes[flag];
        }
        if (status === "cancelled") changes.cancelledAt = FieldValue.serverTimestamp();
        if (status === "settlement") { changes.reviewRequestedAt = FieldValue.serverTimestamp(); changes.cancellationRequestedBy = FieldValue.delete(); changes.cancellationRequestedAt = FieldValue.delete(); }
        if (["leave", "confirm-settlement"].includes(action)) { changes.cancellationRequestedBy = FieldValue.delete(); changes.cancellationRequestedAt = FieldValue.delete(); }
        if (action === "request-cancellation") Object.assign(changes, { cancellationRequestedBy: uid, cancellationRequestedAt: FieldValue.serverTimestamp() });
        if (["decline-cancellation", "withdraw-cancellation"].includes(action)) Object.assign(changes, { cancellationRequestedBy: FieldValue.delete(), cancellationRequestedAt: FieldValue.delete() });
        if (action === "approve-cancellation") Object.assign(changes, { cancelledAt: FieldValue.serverTimestamp(), cancellationApprovedBy: uid });
        if (action === "accept") Object.assign(changes, { questRunnerId: uid, runnerName: name, acceptedAt: FieldValue.serverTimestamp() });
        if (action === "start") changes.startedAt = FieldValue.serverTimestamp();
        if (action === "request-completion") changes.completionRequestedAt = FieldValue.serverTimestamp();
        if (action === "complete") { changes.completedAt = FieldValue.serverTimestamp(); changes.receiptConfirmedAt = FieldValue.serverTimestamp(); }
        if (action === "cancel") changes.cancelledAt = FieldValue.serverTimestamp();
        tx.update(ref, changes);
        tx.create(ref.collection("events").doc(), { actorId: uid, actorName: name, action, fromStatus: quest.status, toStatus: status, reason: typeof input.reason === "string" ? input.reason.trim() : "", ...(["record-expense", "record-receipt"].includes(action) ? { amount: changes.actualExpense, evidence: changes.expenseEvidence } : {}), createdAt: FieldValue.serverTimestamp() });
      });
    },
    async repost(uid: string, id: string) {
      const source = db.collection("quests").doc(id), target = db.collection("quests").doc(), lock = db.collection("requesterLocks").doc(uid);
      await db.runTransaction(async (tx) => {
        const [snapshot, , existing] = await Promise.all([tx.get(source), tx.get(lock), tx.get(db.collection("quests").where("requesterId", "==", uid))]);
        const old = snapshot.data();
        if (!old || old.requesterId !== uid || !["cancelled", "available"].includes(old.status) || old.workflowVersion !== 2 || old.committedAt || old.replacementQuestId) throw new QuestError("Only an uncommitted closed or expired quest can be posted again.", 409);
        const now = Timestamp.now();
        if (old.status === "available" && old.expiresAt?.toMillis() > now.toMillis()) throw new QuestError("This quest is still available.", 409);
        if (existing.docs.some((record) => isActiveQuest(record.data() as WorkflowQuest, now.toMillis()))) throw new QuestError("Manage your current active quest before posting again.", 409);
        const data = validateQuest(old, Boolean(old.attachment));
        tx.create(target, { ...data, ...(old.attachment ? { attachment: old.attachment } : {}), requesterId: uid, requesterName: old.requesterName || "Requester", status: "available", createdAt: now, expiresAt: Timestamp.fromMillis(now.toMillis() + QUEST_WINDOW_MS), replacesQuestId: id });
        tx.create(target.collection("events").doc(), { actorId: uid, actorName: old.requesterName || "Requester", action: "post-replacement", fromQuestId: id, toStatus: "available", createdAt: now });
        tx.update(source, { replacementQuestId: target.id, updatedAt: now });
        tx.set(lock, { questId: target.id, updatedAt: now });
        tx.create(source.collection("events").doc(), { actorId: uid, action: "repost", replacementQuestId: target.id, createdAt: now });
      });
      return target.id;
    },
    async send(uid: string, id: string, input: unknown) {
      if (typeof input !== "string" || !input.trim() || input.trim().length > 2000) throw new QuestError("Messages must contain 1–2,000 characters.");
      const questRef = db.collection("quests").doc(id);
      const messageRef = questRef.collection("messages").doc();
      const limitRef = questRef.collection("messageLimits").doc(uid);
      await db.runTransaction(async (tx) => {
        const [snapshot, limit] = await Promise.all([tx.get(questRef), tx.get(limitRef)]);
        if (!snapshot.exists) throw new QuestError("Quest not found.", 404);
        if (!canMessage(snapshot.data() as WorkflowQuest, uid)) throw new QuestError("Only participants in an accepted or ongoing quest can send messages.", 403);
        const now = Timestamp.now();
        const lastSent = limit.data()?.sentAt as Timestamp | undefined;
        if (lastSent && now.toMillis() - lastSent.toMillis() < 1000) throw new QuestError("Please wait a moment before sending another message.", 429);
        tx.create(messageRef, { senderId: uid, text: input.trim(), createdAt: now });
        tx.set(limitRef, { sentAt: now });
        const quest = snapshot.data() as WorkflowQuest & { title: string };
        const recipient = quest.requesterId === uid ? quest.questRunnerId : quest.requesterId;
        if (recipient) tx.set(db.doc(`users/${recipient}/questInbox/${id}`), {
          questId: id, title: quest.title, messageId: messageRef.id, sentAt: now,
        });
      });
      return messageRef.id;
    },
  };
}
