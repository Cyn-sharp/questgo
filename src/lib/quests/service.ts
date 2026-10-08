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
      });
      return questRef.id;
    },
    async act(uid: string, name: string, id: string, action: string) {
      const ref = db.collection("quests").doc(id);
      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) throw new QuestError("Quest not found.", 404);
        const quest = snapshot.data() as WorkflowQuest;
        const status = transitionQuest(quest, uid, action, Date.now());
        const changes: Record<string, unknown> = { status, updatedAt: FieldValue.serverTimestamp() };
        if (action === "request-cancellation") Object.assign(changes, { cancellationRequestedBy: uid, cancellationRequestedAt: FieldValue.serverTimestamp() });
        if (["decline-cancellation", "withdraw-cancellation"].includes(action)) Object.assign(changes, { cancellationRequestedBy: FieldValue.delete(), cancellationRequestedAt: FieldValue.delete() });
        if (action === "approve-cancellation") Object.assign(changes, { cancelledAt: FieldValue.serverTimestamp(), cancellationApprovedBy: uid });
        if (action === "accept") Object.assign(changes, { questRunnerId: uid, runnerName: name, acceptedAt: FieldValue.serverTimestamp() });
        if (action === "start") changes.startedAt = FieldValue.serverTimestamp();
        if (action === "request-completion") changes.completionRequestedAt = FieldValue.serverTimestamp();
        if (action === "complete") changes.completedAt = FieldValue.serverTimestamp();
        if (action === "cancel") changes.cancelledAt = FieldValue.serverTimestamp();
        tx.update(ref, changes);
      });
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
