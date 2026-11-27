import { adminDb } from "@/lib/auth/firebase-admin";
import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, questId } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

const time = (value: unknown) => (value as { toDate?: () => Date } | undefined)?.toDate?.().toISOString() ?? null;

// GET /api/admin/quests/{id}: one quest's details, activity and messages for the case review page. Admins only.
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await verifiedAdmin(request);
    const id = questId((await context.params).id), ref = adminDb.doc("quests/" + id);
    const [snapshot, events, messages] = await Promise.all([ref.get(), ref.collection("events").orderBy("createdAt", "desc").limit(100).get(), ref.collection("messages").orderBy("createdAt", "desc").limit(100).get()]);
    const q = snapshot.data();
    if (!q) throw new QuestError("This quest no longer exists.", 404);
    const requesterId = String(q.requesterId ?? ""), runnerId = String(q.questRunnerId ?? "");
    // Each person's name and part in the quest, so the admin can tell the requester and the runner apart.
    const person = (uid: unknown, savedName?: unknown) => {
      if (uid && uid === requesterId) return { actorName: String(savedName || q.requesterName || "Requester"), role: "requester" };
      if (uid && uid === runnerId) return { actorName: String(savedName || q.runnerName || "Runner"), role: "runner" };
      if (uid === "system") return { actorName: "QuestGo (automatic)", role: "system" };
      return null;
    };
    const confirmed: unknown[] = Array.isArray(q.settlementConfirmedBy) ? q.settlementConfirmedBy : [];
    const quest = {
      id, title: String(q.title ?? ""), status: String(q.status ?? ""),
      requesterName: String(q.requesterName ?? ""), runnerName: runnerId ? String(q.runnerName ?? "") : "",
      fundingMethod: String(q.fundingMethod ?? ""), reward: Number(q.reward) || 0, actualExpense: Number(q.actualExpense) || 0,
      expenseEvidence: String(q.expenseEvidence ?? ""), expenseApproved: q.expenseApproved === true, receiptRecorded: Boolean(q.receiptRecordedAt),
      closedReason: String(q.closedReason ?? ""), issueReason: String(q.issueReason ?? ""), resolutionNote: String(q.resolutionNote ?? ""),
      requesterConfirmed: Boolean(requesterId) && confirmed.includes(requesterId), runnerConfirmed: Boolean(runnerId) && confirmed.includes(runnerId),
    };
    return Response.json({
      quest,
      // Anyone else who acted on the quest is an admin (a suspension is saved without a name, so it shows "Administrator").
      events: events.docs.map((d) => { const e = d.data(); return { id: d.id, ...e, ...(person(e.actorId, e.actorName) ?? (e.actorId ? { actorName: String(e.actorName || "Administrator"), role: "admin" } : { actorName: String(e.actorName || "Unknown"), role: "" })), createdAt: time(e.createdAt) }; }),
      messages: messages.docs.map((d) => { const m = d.data(); return { id: d.id, ...m, ...(person(m.senderId) ?? { actorName: "Unknown sender", role: "" }), createdAt: time(m.createdAt) }; }),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}