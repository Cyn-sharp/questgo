import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { EMAIL_POLICY_MESSAGE, isAllowedEmail } from "@/lib/auth/email-policy";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      idToken?: string;
      fullName?: string;
      email?: string;
      profilePhotoUrl?: string;
    };
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!body.idToken || !fullName || !email || !isAllowedEmail(email)) {
      return NextResponse.json({ message: EMAIL_POLICY_MESSAGE }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(body.idToken);
    if (decodedToken.uid === undefined || decodedToken.email?.toLowerCase() !== email) {
      return NextResponse.json({ message: "Registration details do not match the authenticated account." }, { status: 401 });
    }

    await adminDb.collection("users").doc(decodedToken.uid).set(
      {
        id: decodedToken.uid,
        email,
        fullName,
        isVerified: decodedToken.email_verified === true,
        ...(body.profilePhotoUrl ? { profilePhotoUrl: body.profilePhotoUrl } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, emailVerified: decodedToken.email_verified === true });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ message: "Unable to finish account setup." }, { status: 500 });
  }
}