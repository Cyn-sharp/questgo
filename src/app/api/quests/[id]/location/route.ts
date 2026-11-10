import { apiError, questId, quests, readBody, verifiedActor } from "@/lib/quests/api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);
    await quests.shareLocation(actor.uid, id, await readBody(request));
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    await quests.stopSharing(actor.uid, questId((await context.params).id));
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
