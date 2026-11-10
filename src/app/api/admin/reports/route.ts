import { adminAuth } from "@/lib/auth/firebase-admin";
import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, readBody, safety } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

export async function GET(request: Request) {
  try {
    await verifiedAdmin(request);
    return Response.json({ reports: await safety.openReports() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await verifiedAdmin(request);
    const body = await readBody(request);
    const id = String(body.id ?? "");
    if (!/^[A-Za-z0-9_-]{1,260}$/.test(id)) throw new QuestError("Invalid report.");
    const { outcome, reportedId } = await safety.resolve(actor.uid, actor.name, id, body);
    if (outcome === "suspended") {
      // Disabled accounts fail verifiedActor and session checks; revoking ends existing sessions.
      await adminAuth.updateUser(reportedId, { disabled: true });
      await adminAuth.revokeRefreshTokens(reportedId);
    }
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
