import { apiError, quests, readBody, verifiedActor } from "@/lib/quests/api";

export async function POST(request: Request) {
  try {
    const actor = await verifiedActor(request);
    const id = await quests.create(actor.uid, actor.name, await readBody(request));
    return Response.json({ id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
