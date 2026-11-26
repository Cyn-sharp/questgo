import { apiError, questId, quests, readBody, requireApprovedId, verifiedActor } from "@/lib/quests/api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);
    const body = await readBody(request);
    // Reposting adds a new quest, and accepting makes you the runner: both need an approved CIT-U ID.
    // Every other step (start, finish, cancel...) stays open, so quests already underway can finish.
    if (body.action === "repost") await requireApprovedId(actor.uid, "post");
    if (body.action === "accept") await requireApprovedId(actor.uid, "accept");
    if (body.action === "repost") return Response.json({ id: await quests.repost(actor.uid, id) });
    await quests.act(actor.uid, actor.name, id, String(body?.action ?? ""), body);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}