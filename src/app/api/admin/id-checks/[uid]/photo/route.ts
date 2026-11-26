import { adminDb } from "@/lib/auth/firebase-admin";
import { idReviewService } from "@/lib/auth/id-review-service";
import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, audit } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

const idReviews = idReviewService(adminDb, audit);

// GET /api/admin/id-checks/{uid}/photo: one student's ID photo. Admins only, never cached.
export async function GET(request: Request, context: { params: Promise<{ uid: string }> }) {
  try {
    await verifiedAdmin(request);
    const uid = (await context.params).uid;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new QuestError("Invalid student.");
    const photo = await idReviews.photo(uid);
    if (!photo) throw new QuestError("No ID photo on file. Reject it and ask the student to send one.", 404);
    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) { return apiError(error); }
}