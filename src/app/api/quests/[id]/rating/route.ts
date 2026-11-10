import { adminDb } from "@/lib/auth/firebase-admin";
import { apiError, verifiedActor, questId, readBody } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";
import { FieldValue } from "firebase-admin/firestore";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await verifiedActor(request), id = questId((await context.params).id), body = await readBody(request);
    if (!Number.isInteger(body.rating) || Number(body.rating) < 1 || Number(body.rating) > 5) throw new QuestError("Choose 1–5 stars.");
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (comment.length > 1000) throw new QuestError("Keep the review within 1,000 characters.");
    await adminDb.runTransaction(async (tx) => {
      const q = (await tx.get(adminDb.doc("quests/" + id))).data();
      if (!q || q.status !== "completed" || ![q.requesterId, q.questRunnerId].includes(actor.uid)) throw new QuestError("Only participants can rate a completed quest.", 403);
      const revieweeId = actor.uid === q.requesterId ? q.questRunnerId : q.requesterId;
      const ratingRef = adminDb.collection("quests").doc(id).collection("ratings").doc(actor.uid), userRef = adminDb.doc("users/" + revieweeId);
      const [existing, user] = await Promise.all([tx.get(ratingRef), tx.get(userRef)]);
      if (existing.exists) throw new QuestError("You already rated this quest.", 409);
      const count = Number(user.data()?.ratingCount || 0), total = Number(user.data()?.ratingTotal || 0) + Number(body.rating);
      tx.create(ratingRef, { questId: id, reviewerId: actor.uid, revieweeId, rating: body.rating, comment, createdAt: FieldValue.serverTimestamp() });
      tx.set(userRef, { ratingCount: count + 1, ratingTotal: total, averageRating: Math.round(total / (count + 1) * 10) / 10, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }); return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
