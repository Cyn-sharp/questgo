import { randomBytes, randomInt } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/auth/firebase-admin";
import { apiError, questId, verifiedActor } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);

    const questRef = adminDb.doc(`quests/${id}`);
    const handoverRef = questRef.collection("private").doc("handover");

    const result = await adminDb.runTransaction(async (tx) => {
      const [questSnap, handoverSnap] = await Promise.all([tx.get(questRef), tx.get(handoverRef)]);
      const quest = questSnap.data();
      if (!quest) throw new QuestError("Quest not found.", 404);
      if (quest.requesterId !== actor.uid) {
        throw new QuestError("Only the requester can view the handover QR code.", 403);
      }
      if (quest.status !== "in_progress" || !quest.completionRequestedAt) {
        throw new QuestError("The QR code unlocks once the runner marks the work ready.", 409);
      }
      if (quest.cancellationRequestedBy || quest.issueRequestedBy) {
        throw new QuestError("Resolve the pending cancellation or issue before handover.", 409);
      }

      if (handoverSnap.exists) {
        const data = handoverSnap.data()!;
        return { token: String(data.token), shortCode: String(data.shortCode) };
      }

      const token = randomBytes(16).toString("base64url");
      const shortCode = String(randomInt(100000, 1000000));
      tx.set(handoverRef, { token, shortCode, createdAt: FieldValue.serverTimestamp() });
      return { token, shortCode };
    });

    return Response.json(
      {
        qrPayload: JSON.stringify({ questId: id, token: result.token }),
        shortCode: result.shortCode,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}