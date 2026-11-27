import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { EMAIL_POLICY_MESSAGE, isAllowedEmail } from "@/lib/auth/email-policy";
import { STUDENT_ID_MAX_BYTES, detectStudentIdImage } from "@/lib/auth/student-id";

// POST /api/student-id — a student sends (or re-sends) a photo of their CIT-U ID.
// It runs right after sign-up, so the email doesn't need to be verified yet.
// The photo goes to studentIdPhotos/{uid}, which only the server can read
// (the Firestore rules deny every path they don't list).

function fail(status: number, message: string) {
  return Response.json({ message }, { status });
}

export async function POST(request: Request) {
  const bearer = request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ")) return fail(401, "Please log in again.");
  let uid: string;
  try {
    const token = await adminAuth.verifyIdToken(bearer.slice(7), true);
    if (!isAllowedEmail(token.email)) return fail(403, EMAIL_POLICY_MESSAGE);
    uid = token.uid;
  } catch {
    return fail(401, "Your session has expired. Please log in again.");
  }

  // Read the upload, stopping early if it is too big.
  const reader = request.body?.getReader();
  if (!reader) return fail(400, "Choose a photo of your CIT-U ID.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > STUDENT_ID_MAX_BYTES + 32_000) {
      await reader.cancel();
      return fail(413, "That photo is too large. Please choose a smaller one.");
    }
    chunks.push(value);
  }

  let photo: FormDataEntryValue | null;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": contentType } }).formData();
    photo = form.get("photo");
  } catch {
    return fail(400, "The upload didn't come through. Please choose your ID photo again.");
  }
  if (!(photo instanceof File)) return fail(400, "Choose a photo of your CIT-U ID.");
  const bytes = new Uint8Array(await photo.arrayBuffer());
  const contentType = detectStudentIdImage(bytes);
  if (!contentType) return fail(400, "Please upload a JPG or PNG photo of your CIT-U ID.");
  if (bytes.length > STUDENT_ID_MAX_BYTES) return fail(413, "That photo is too large. Please choose a smaller one.");

  try {
    const userRef = adminDb.doc(`users/${uid}`);
    const alreadyApproved = await adminDb.runTransaction(async (tx) => {
      if ((await tx.get(userRef)).data()?.idStatus === "approved") return true;
      // One photo per student: a new upload replaces the old one.
      tx.set(adminDb.doc(`studentIdPhotos/${uid}`), {
        photo: Buffer.from(bytes),
        contentType,
        size: bytes.length,
        uploadedAt: FieldValue.serverTimestamp(),
      });
      tx.set(userRef, {
        idStatus: "pending",
        idSubmittedAt: FieldValue.serverTimestamp(),
        idRejectReason: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return false;
    });
    if (alreadyApproved) return fail(409, "Your student ID is already approved.");
    return Response.json({ ok: true, idStatus: "pending" });
  } catch (error) {
    console.error("Student ID upload failed:", error);
    return fail(503, "Your ID photo could not be saved. Please try again in a moment.");
  }
}