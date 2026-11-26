import { adminAuth } from "@/lib/auth/firebase-admin";
import { apiError, limiter, readBody, runners, verifiedActor } from "@/lib/quests/api";

// The signed-in user's own runner application status.
export async function GET(request: Request) {
  try {
    const actor = await verifiedActor(request);
    return Response.json(await runners.mine(actor.uid), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await verifiedActor(request);
    await limiter.hit(actor.uid, "runner-apply", 5, 24 * 60 * 60 * 1000);
    const body = await readBody(request);
    const email = (await adminAuth.getUser(actor.uid)).email;
    await runners.apply(actor.uid, actor.name, email, body);
    return Response.json({ ok: true, status: "pending" });
  } catch (error) { return apiError(error); }
}
