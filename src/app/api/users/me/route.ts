import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { ProfileError, validateProfile } from "@/lib/auth/profile";
import { apiError, forgetActor, limiter, readBody, verifiedActor } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

// One server call updates both the Auth display name and the Firestore profile,
// so the two can't silently drift apart if one write fails.
export async function PATCH(request: Request) {
  try {
    const actor = await verifiedActor(request);
    let profile;
    try { profile = validateProfile(await readBody(request)); }
    catch (error) { throw new QuestError(error instanceof ProfileError ? error.message : "Invalid profile."); }
    await limiter.hit(actor.uid, "profile", 20, 60 * 60 * 1000);
    const before = await adminAuth.getUser(actor.uid);
    await adminAuth.updateUser(actor.uid, { displayName: profile.fullName });
    try {
      await adminDb.doc(`users/${actor.uid}`).set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } catch (error) {
      await adminAuth.updateUser(actor.uid, { displayName: before.displayName ?? null }).catch(() => console.error("Could not roll back display name", actor.uid));
      throw error;
    }
    forgetActor(actor.uid);
    return Response.json({ ok: true, ...profile });
  } catch (error) { return apiError(error); }
}
