import { apiError, limiter, questId, quests, readBody, verifiedActor } from "@/lib/quests/api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const id = questId((await context.params).id);
    const body = await readBody(request);
    await limiter.hit(actor.uid, "rating", 20, 60 * 60 * 1000);
    await quests.rate(actor.uid, id, body);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
