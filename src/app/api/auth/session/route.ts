import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth/firebase-admin";

const SESSION_COOKIE = "questgo_session";
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ message: "Missing authentication token." }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken.email_verified) {
      return NextResponse.json({ message: "Please verify your email before logging in." }, { status: 403 });
    }

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json({ message: "Unable to create a secure session." }, { status: 401 });
  }
}