import { adminDb } from "@/lib/auth/firebase-admin";
import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, questId } from "@/lib/quests/api";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await verifiedAdmin(request); const id = questId((await context.params).id), ref = adminDb.doc("quests/" + id);
    const [events, messages] = await Promise.all([ref.collection("events").orderBy("createdAt", "desc").limit(100).get(), ref.collection("messages").orderBy("createdAt", "desc").limit(100).get()]);
    const serialize = (docs: typeof events.docs) => docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate().toISOString() ?? null }));
    return Response.json({ events: serialize(events.docs), messages: serialize(messages.docs) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
