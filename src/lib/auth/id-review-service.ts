import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { QuestError } from "@/lib/quests/policy";
import type { auditService } from "@/lib/quests/audit";
import { validateIdDecision } from "./id-review";

type Audit = Pick<ReturnType<typeof auditService>, "inTransaction">;
type Admin = { uid: string; name: string };

const PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);

/** A Firestore time as text (or null), so it can be sent to the admin page and compared later. */
function timeText(value: unknown) {
  const time = value as { toDate?: () => Date } | null | undefined;
  return typeof time?.toDate === "function" ? time.toDate().toISOString() : null;
}

// Server only. Students' ID photos live in studentIdPhotos/{uid}, which the
// Firestore rules hide from every app user. Only admins reach them, through these functions.
export function idReviewService(db: Firestore, audit: Audit) {
  const userRef = (uid: string) => db.doc(`users/${uid}`);
  const photoRef = (uid: string) => db.doc(`studentIdPhotos/${uid}`);

  return {
    /** Students waiting for an ID check, oldest first (first come, first served). */
    async pending(limit = 100) {
      const snapshot = await db.collection("users").where("idStatus", "==", "pending").limit(Math.min(limit, 200)).get();
      return snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: String(data.fullName ?? "").trim() || "No name on the account",
            email: String(data.email ?? ""),
            course: String(data.course ?? ""),
            submittedAt: timeText(data.idSubmittedAt),
          };
        })
        .sort((a, b) => String(a.submittedAt ?? "").localeCompare(String(b.submittedAt ?? "")));
    },

    /** The ID photo on file for a student, or null if there is none. */
    async photo(uid: string) {
      const data = (await photoRef(uid).get()).data();
      const bytes = data?.photo as Uint8Array | undefined;
      if (!bytes?.length) return null;
      return { bytes: Buffer.from(bytes), contentType: PHOTO_TYPES.has(data?.contentType) ? String(data?.contentType) : "application/octet-stream" };
    },

    /** Approves or rejects a student's ID. Saved together with its audit log entry, or not at all. */
    async decide(admin: Admin, uid: string, input: unknown) {
      const decision = validateIdDecision(input);
      return db.runTransaction(async (tx) => {
        const snapshot = await tx.get(userRef(uid));
        const data = snapshot.data();
        if (!data) throw new QuestError("Student not found.", 404);
        if (data.idStatus !== "pending") throw new QuestError("This ID was already reviewed. Refresh the list.", 409);
        // The admin must be looking at the latest photo. If the student sent a new one, show it first.
        if ((timeText(data.idSubmittedAt) ?? "") !== decision.submittedAt) {
          throw new QuestError("This student just sent a new photo. Refresh the list to see it.", 409);
        }
        const now = FieldValue.serverTimestamp();
        tx.set(
          userRef(uid),
          decision.outcome === "approve"
            ? { idStatus: "approved", idReviewedAt: now, idRejectReason: FieldValue.delete(), updatedAt: now }
            : { idStatus: "rejected", idReviewedAt: now, idRejectReason: decision.reason, updatedAt: now },
          { merge: true },
        );
        // The photo is only needed for this check, so it is deleted once an admin decides.
        tx.delete(photoRef(uid));
        const who = String(data.email ?? "").trim() || uid;
        audit.inTransaction(
          tx,
          admin,
          decision.outcome === "approve" ? "id-approved" : "id-rejected",
          { type: "user", id: uid },
          decision.outcome === "approve" ? `CIT-U ID approved for ${who}` : `CIT-U ID rejected for ${who}: ${decision.reason}`,
        );
        return { outcome: decision.outcome, name: String(data.fullName ?? "").trim() };
      });
    },
  };
}