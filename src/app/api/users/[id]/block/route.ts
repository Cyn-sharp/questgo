import { adminAuth } from "@/lib/auth/firebase-admin";
import { apiError, safety, verifiedActor } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";
import { validateBlockTarget } from "@/lib/quests/safety";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    const target = validateBlockTarget(actor.uid, (await context.params).id);
    const account = await adminAuth.getUser(target).catch(() => null);
    if (!account) throw new QuestError("User not found.", 404);
    await safety.block(actor.uid, target, account.displayName?.trim() || "QuestGo User");
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await verifiedActor(request);
    await safety.unblock(actor.uid, validateBlockTarget(actor.uid, (await context.params).id));
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
