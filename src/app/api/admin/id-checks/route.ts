import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { idReviewService } from "@/lib/auth/id-review-service";
import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, audit, readBody } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

const idReviews = idReviewService(adminDb, audit);

// Suspended (disabled) or deleted accounts can't use QuestGo, so they don't need an ID check.
// Firebase looks up at most 100 accounts per call.
async function activeOnly<T extends { uid: string }>(students: T[]) {
  const active = new Set<string>();
  for (let start = 0; start < students.length; start += 100) {
    const { users } = await adminAuth.getUsers(students.slice(start, start + 100).map(({ uid }) => ({ uid })));
    for (const account of users) if (!account.disabled) active.add(account.uid);
  }
  return students.filter((student) => active.has(student.uid));
}

// GET /api/admin/id-checks: students whose CIT-U ID is waiting for review. Admins only.
export async function GET(request: Request) {
  try {
    await verifiedAdmin(request);
    return Response.json({ students: await activeOnly(await idReviews.pending()) }, { headers: { "Cache-Control": "private, no-store" } });
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