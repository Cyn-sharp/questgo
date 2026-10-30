import { apiError, questId, quests, readBody, verifiedActor } from "@/lib/quests/api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);
    const body = await readBody(request);
    if (body.action === "repost") return Response.json({ id: await quests.repost(actor.uid, id) });
    await quests.act(actor.uid, actor.name, id, String(body?.action ?? ""), body);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
