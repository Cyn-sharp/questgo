import { apiError, questId, quests, readBody, verifiedActor } from "@/lib/quests/api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);
    const body = await readBody(request);
    const messageId = await quests.send(actor.uid, id, body?.text);
    return Response.json({ id: messageId }, { status: 201 });
  } catch (error) { return apiError(error); }
}
