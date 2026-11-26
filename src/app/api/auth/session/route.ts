import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { EMAIL_POLICY_MESSAGE, isAllowedEmail } from "@/lib/auth/email-policy";

const SESSION_COOKIE = "questgo_session";
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ message: "Missing authentication token." }, { status: 400 });
    }

    // checkRevoked rejects tokens issued before a suspension revoked the account's sessions.
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    if (!decodedToken.email_verified) {
      return NextResponse.json({ message: "Please verify your email before logging in." }, { status: 403 });
    }
    if (!isAllowedEmail(decodedToken.email)) {
      return NextResponse.json({ message: EMAIL_POLICY_MESSAGE }, { status: 403 });
    }
    const account = await adminAuth.getUser(decodedToken.uid);
    if (account.disabled) {
      return NextResponse.json({ message: "This account has been suspended." }, { status: 403 });
    }

    // Registration stores isVerified before the email is confirmed; keep it in sync once login succeeds.
    await adminDb.doc(`users/${decodedToken.uid}`).update({ isVerified: true, updatedAt: FieldValue.serverTimestamp() }).catch(() => undefined);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    });

      // Admins start in the admin console; everyone else starts on Home.
    return NextResponse.json({ ok: true, home: account.customClaims?.admin === true ? "/admin" : "/dashboard" });
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json({ message: "Unable to create a secure session." }, { status: 401 });
  }
}