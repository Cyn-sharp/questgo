import { apiError, questId, readBody, safety, verifiedActor } from "@/lib/quests/api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);
    const body = await readBody(request);
    const reportId = await safety.report(actor.uid, actor.name, id, body);
    return Response.json({ id: reportId }, { status: 201 });
  } catch (error) { return apiError(error); }
}
