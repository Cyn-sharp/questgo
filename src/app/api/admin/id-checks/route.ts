import { adminDb } from "@/lib/auth/firebase-admin";
import { idReviewService } from "@/lib/auth/id-review-service";
import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, audit, readBody } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

const idReviews = idReviewService(adminDb, audit);

// GET /api/admin/id-checks: students whose CIT-U ID is waiting for review. Admins only.
export async function GET(request: Request) {
  try {
    await verifiedAdmin(request);
    return Response.json({ students: await idReviews.pending() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

// POST /api/admin/id-checks: approve or reject one student's ID.
// Body: { uid, outcome: "approve" | "reject", reason (needed to reject), submittedAt }
export async function POST(request: Request) {
  try {
    const admin = await verifiedAdmin(request);
    const body = await readBody(request);
    const uid = String(body.uid ?? "");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new QuestError("Invalid student.");
    return Response.json({ ok: true, ...(await idReviews.decide(admin, uid, body)) });
  } catch (error) { return apiError(error); }
}