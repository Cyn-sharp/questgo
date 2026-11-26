import { apiError, limiter, questId, readBody, safety, verifiedActor } from "@/lib/quests/api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);
    const body = await readBody(request);
    await limiter.hit(actor.uid, "report", 10, 60 * 60 * 1000);
    const reportId = await safety.report(actor.uid, actor.name, id, body);
    return Response.json({ id: reportId }, { status: 201 });
  } catch (error) { return apiError(error); }
}
