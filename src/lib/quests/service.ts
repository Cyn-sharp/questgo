import { recoveryChanges, suspensionChanges } from "./recovery";
import { nextAggregate, validateRating } from "./ratings";
import type { safetyService } from "./safety-service";
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { canMessage, isActiveQuest, QuestError, QUEST_WINDOW_MS, transitionQuest, validateQuest, type WorkflowQuest } from "./policy";
import { canShareLocation, MIN_LOCATION_INTERVAL_MS, TRACKING_STATUSES, validateLocation } from "./tracking";

export function questService(db: Firestore, safety?: Pick<ReturnType<typeof safetyService>, "eitherBlocked">) {
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
        // Deliberately vague so a user cannot discover who has blocked them.
        if (action === "accept" && safety && await safety.eitherBlocked(tx, uid, quest.requesterId)) throw new QuestError("You can't accept this quest.", 403);
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
        if (!TRACKING_STATUSES.includes(String(status))) tx.delete(ref.collection("tracking").doc("runner"));
        tx.create(ref.collection("events").doc(), { actorId: uid, actorName: name, action, fromStatus: quest.status, toStatus: status, reason: typeof input.reason === "string" ? input.reason.trim() : "", ...(["record-expense", "record-receipt"].includes(action) ? { amount: changes.actualExpense, evidence: changes.expenseEvidence } : {}), createdAt: FieldValue.serverTimestamp() });
      });
    },
    // Closes or escalates every open quest of a suspended user. Idempotent: each quest is re-read in its own transaction.
    async suspendUser(adminId: string, uid: string) {
      const [asRequester, asRunner] = await Promise.all([
        db.collection("quests").where("requesterId", "==", uid).get(),
        db.collection("quests").where("questRunnerId", "==", uid).get(),
      ]);
      const ids = [...new Set([...asRequester.docs, ...asRunner.docs].map((d) => d.id))];
      let changed = 0;
      for (const id of ids) {
        const ref = db.collection("quests").doc(id);
        await db.runTransaction(async (tx) => {
          const quest = (await tx.get(ref)).data() as WorkflowQuest | undefined;
          const outcome = quest && suspensionChanges(quest, uid);
          if (!quest || !outcome) return;
          tx.update(ref, {
            status: outcome.status, closedReason: outcome.closedReason, updatedAt: FieldValue.serverTimestamp(),
            cancellationRequestedBy: FieldValue.delete(), cancellationRequestedAt: FieldValue.delete(),
            issueRequestedBy: FieldValue.delete(), issueDeadline: FieldValue.delete(),
            ...(outcome.status === "cancelled" ? { cancelledAt: FieldValue.serverTimestamp() } : { reviewRequestedAt: FieldValue.serverTimestamp() }),
          });
          tx.delete(ref.collection("tracking").doc("runner"));
          tx.create(ref.collection("events").doc(), { actorId: adminId, action: "account-suspended", suspendedId: uid, fromStatus: quest.status, toStatus: outcome.status, createdAt: FieldValue.serverTimestamp() });
          changed++;
        });
      }
      return changed;
    },
    // Marks unclaimed quests past their window as expired so history and queries stay accurate without client help.
    async expireStale(limit = 200) {
      const stale = await db.collection("quests").where("status", "==", "available").where("expiresAt", "<=", Timestamp.now()).limit(limit).get();
      let expired = 0;
      for (const doc of stale.docs) {
        await db.runTransaction(async (tx) => {
          const quest = (await tx.get(doc.ref)).data() as WorkflowQuest | undefined;
          if (!quest || quest.status !== "available" || quest.questRunnerId || !quest.expiresAt || quest.expiresAt.toMillis() > Date.now()) return;
          tx.update(doc.ref, { status: "expired", expiredAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
          tx.create(doc.ref.collection("events").doc(), { actorId: "system", action: "expire", fromStatus: "available", toStatus: "expired", createdAt: FieldValue.serverTimestamp() });
          expired++;
        });
      }
      return expired;
    },
    async rate(uid: string, id: string, input: unknown) {
      const { rating, comment } = validateRating(input);
      await db.runTransaction(async (tx) => {
        const questRef = db.collection("quests").doc(id);
        const quest = (await tx.get(questRef)).data();
        if (!quest || quest.status !== "completed" || ![quest.requesterId, quest.questRunnerId].includes(uid)) throw new QuestError("Only participants can rate a completed quest.", 403);
        const revieweeId = uid === quest.requesterId ? quest.questRunnerId : quest.requesterId;
        const ratingRef = questRef.collection("ratings").doc(uid), userRef = db.doc(`users/${revieweeId}`);
        const [existing, user] = await Promise.all([tx.get(ratingRef), tx.get(userRef)]);
        if (existing.exists) throw new QuestError("You already rated this quest.", 409);
        tx.create(ratingRef, { questId: id, reviewerId: uid, revieweeId, rating, comment, createdAt: FieldValue.serverTimestamp() });
        tx.set(userRef, { ...nextAggregate(user.data(), rating), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      });
    },
    async repost(uid: string, id: string) {
      const source = db.collection("quests").doc(id), target = db.collection("quests").doc(), lock = db.collection("requesterLocks").doc(uid);
      await db.runTransaction(async (tx) => {
        const [snapshot, , existing] = await Promise.all([tx.get(source), tx.get(lock), tx.get(db.collection("quests").where("requesterId", "==", uid))]);
        const old = snapshot.data();
        if (!old || old.requesterId !== uid || !["cancelled", "available", "expired"].includes(old.status) || old.workflowVersion !== 2 || old.committedAt || old.replacementQuestId) throw new QuestError("Only an uncommitted closed or expired quest can be posted again.", 409);
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
        const quest = snapshot.data() as WorkflowQuest & { title: string };
        const recipient = quest.requesterId === uid ? quest.questRunnerId : quest.requesterId;
        // Reads must finish before any write in a transaction. Deliberately vague, like accept.
        if (recipient && safety && await safety.eitherBlocked(tx, uid, recipient)) throw new QuestError("You can't message this user.", 403);
        const now = Timestamp.now();
        const lastSent = limit.data()?.sentAt as Timestamp | undefined;
        if (lastSent && now.toMillis() - lastSent.toMillis() < 1000) throw new QuestError("Please wait a moment before sending another message.", 429);
        tx.create(messageRef, { senderId: uid, text: input.trim(), createdAt: now });
        tx.set(limitRef, { sentAt: now });
        if (recipient) tx.set(db.doc(`users/${recipient}/questInbox/${id}`), {
          questId: id, title: quest.title, messageId: messageRef.id, sentAt: now,
        });
      });
      return messageRef.id;
    },
    async shareLocation(uid: string, id: string, input: Record<string, unknown>) {
      const location = validateLocation(input);
      const questRef = db.collection("quests").doc(id);
      const trackingRef = questRef.collection("tracking").doc("runner");
      await db.runTransaction(async (tx) => {
        const [snapshot, previous] = await Promise.all([tx.get(questRef), tx.get(trackingRef)]);
        if (!snapshot.exists) throw new QuestError("Quest not found.", 404);
        if (!canShareLocation(snapshot.data() as WorkflowQuest, uid)) throw new QuestError("Only the runner can share location while the quest is underway.", 403);
        const now = Timestamp.now();
        const last = previous.data()?.updatedAt as Timestamp | undefined;
        if (last && now.toMillis() - last.toMillis() < MIN_LOCATION_INTERVAL_MS) throw new QuestError("Location updates are limited to one every 5 seconds.", 429);
        tx.set(trackingRef, { ...location, updatedAt: now });
      });
    },
    async stopSharing(uid: string, id: string) {
      const questRef = db.collection("quests").doc(id);
      const snapshot = await questRef.get();
      if (!snapshot.exists) throw new QuestError("Quest not found.", 404);
      if (snapshot.data()?.questRunnerId !== uid) throw new QuestError("Only the runner can stop sharing.", 403);
      await questRef.collection("tracking").doc("runner").delete();
    },
  };
}
