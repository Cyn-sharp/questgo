import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, readBody, runners } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

export async function GET(request: Request) {
  try {
    await verifiedAdmin(request);
    return Response.json({ applications: await runners.pending() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await verifiedAdmin(request);
    const body = await readBody(request);
    const uid = String(body.uid ?? "");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new QuestError("Invalid applicant.");
    await runners.decide(actor, uid, body);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
