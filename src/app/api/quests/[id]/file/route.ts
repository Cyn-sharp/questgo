import { apiError, questId, verifiedActor } from "@/lib/quests/api";
import { adminDb } from "@/lib/auth/firebase-admin";
import { QuestError } from "@/lib/quests/policy";
import { questBucket } from "@/lib/quests/storage";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);
    const snapshot = await adminDb.doc(`quests/${id}`).get();
    const quest = snapshot.data();
    if (!quest) throw new QuestError("Quest not found.", 404);
    if (quest.requesterId !== actor.uid && quest.questRunnerId !== actor.uid) throw new QuestError("Only the requester and assigned runner can open this file.", 403);
    if (!quest.attachment) throw new QuestError("No printing file is attached.", 404);
    const [buffer] = await questBucket().file(quest.attachment.path).download();
    return new Response(new Uint8Array(buffer), { headers: {
      "Content-Type": quest.attachment.contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(quest.attachment.name)}`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) { return apiError(error); }
}
