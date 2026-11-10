import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { apiError, verifiedActor, questId } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request), id = questId((await context.params).id);
    const snapshot = await adminDb.doc("quests/" + id).get(), q = snapshot.data();
    if (!q) throw new QuestError("Quest not found.", 404);
    const account = await adminAuth.getUser(actor.uid);
    if (q.requesterId !== actor.uid && q.questRunnerId !== actor.uid && account.customClaims?.admin !== true) throw new QuestError("Participants only.", 403);
    const events = await snapshot.ref.collection("events").orderBy("createdAt", "desc").limit(100).get();
    return Response.json({ events: events.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate().toISOString() ?? null })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
