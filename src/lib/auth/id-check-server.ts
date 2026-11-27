import { cache } from "react";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { canPostAndAccept, idCheckState, idRejectReason, type IdCheckState } from "@/lib/auth/id-check";

export type IdCheck = {
  state: IdCheckState;
  isAdmin: boolean;
  canPostAndAccept: boolean;
  reason: string;
  submittedAt: number | null;
};

/**
 * Reads a student's ID check from users/{uid} (server only).
 * `adminClaim` is the admin flag from a token we already have. If it isn't
 * true, we ask Firebase directly, because a login can be older than the admin role.
 */
export async function readIdCheck(uid: string, adminClaim?: unknown): Promise<IdCheck> {
  const data = (await adminDb.doc(`users/${uid}`).get()).data();
  const state = idCheckState(data);
  let isAdmin = adminClaim === true;
  if (!isAdmin && state !== "approved") {
    isAdmin = (await adminAuth.getUser(uid)).customClaims?.admin === true;
  }
  const submitted = data?.idSubmittedAt;
  return {
    state,
    isAdmin,
    canPostAndAccept: canPostAndAccept(state, isAdmin),
    reason: state === "rejected" ? idRejectReason(data) : "",
    submittedAt: typeof submitted?.toMillis === "function" ? submitted.toMillis() : null,
  };
}

/** The logged-in user's session, for server pages. Null when there is no valid session. Checked once per page load. */
export const currentSession = cache(async () => {
  const cookie = (await cookies()).get("questgo_session")?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return decoded.email_verified ? decoded : null;
  } catch {
    return null;
  }
});

/** The logged-in user's ID check, for server pages. Null when there is no valid session. */
export const currentIdCheck = cache(async () => {
  const session = await currentSession();
  return session ? readIdCheck(session.uid, session.admin) : null;
});