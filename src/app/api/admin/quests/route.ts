import { adminDb } from "@/lib/auth/firebase-admin";
import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, questId, readBody } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";
import { FieldValue } from "firebase-admin/firestore";
export async function GET(request: Request) {
  try {
    await verifiedAdmin(request);
    const records = await adminDb.collection("quests").where("status", "==", "settlement").limit(100).get();
    return Response.json({ quests: records.docs.map((d) => { const q = d.data(); return { id: d.id, title: q.title, issueReason: q.issueReason || "Cancellation / unresolved handover", requesterName: q.requesterName, runnerName: q.runnerName, actualExpense: q.actualExpense || 0, expenseEvidence: q.expenseEvidence || "", expenseApproved: q.expenseApproved === true, fundingMethod: q.fundingMethod || "Not recorded", reward: q.reward }; }) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await verifiedAdmin(request), body = await readBody(request), id = questId(String(body.id || ""));
    if (typeof body.note !== "string" || body.note.trim().length < 10 || body.note.trim().length > 2000) throw new QuestError("Explain the decision in 10–2,000 characters.");
    if (body.settlementVerified !== true) throw new QuestError("Confirm that you reviewed and resolved the outstanding obligations.");
    const ref = adminDb.doc("quests/" + id);
    await adminDb.runTransaction(async (tx) => {
      const q = (await tx.get(ref)).data();
      if (!q || q.status !== "settlement") throw new QuestError("This case is no longer awaiting review.", 409);
      tx.update(ref, { status: "cancelled", resolutionNote: body.note, resolvedBy: actor.uid, resolvedAt: FieldValue.serverTimestamp(), cancelledAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      tx.create(ref.collection("events").doc(), { actorId: actor.uid, actorName: actor.name, action: "admin-resolution", reason: body.note, fromStatus: "settlement", toStatus: "cancelled", createdAt: FieldValue.serverTimestamp() });
    });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
