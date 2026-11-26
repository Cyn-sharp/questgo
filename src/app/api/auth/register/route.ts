import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { isAllowedPhotoUrl } from "@/lib/auth/profile-photo";
import { EMAIL_POLICY_MESSAGE, isAllowedEmail } from "@/lib/auth/email-policy";
import { isCourse } from "@/lib/auth/courses";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      idToken?: string;
      fullName?: string;
      email?: string;
      profilePhotoUrl?: string;
      course?: unknown;
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

    if (fullName.length > 100) {
      return NextResponse.json({ message: "Full name must be 100 characters or fewer." }, { status: 400 });
    }
    if (body.profilePhotoUrl && !isAllowedPhotoUrl(body.profilePhotoUrl)) {
      return NextResponse.json({ message: "Invalid profile photo." }, { status: 400 });
    }
    // The course is picked from the list at sign-up. Anything else is refused.
    if (body.course !== undefined && body.course !== "" && !isCourse(body.course)) {
      return NextResponse.json({ message: "Choose a course from the list." }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(decodedToken.uid);
    await adminDb.runTransaction(async (tx) => {
      const existing = await tx.get(userRef);
      tx.set(
        userRef,
        {
          id: decodedToken.uid,
          email,
          fullName,
          isVerified: decodedToken.email_verified === true,
          ...(body.profilePhotoUrl ? { profilePhotoUrl: body.profilePhotoUrl } : {}),
          ...(isCourse(body.course) ? { course: body.course } : {}),
          // Re-running setup must not rewrite the original signup time.
          ...(existing.exists && existing.data()?.createdAt ? {} : { createdAt: FieldValue.serverTimestamp() }),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return NextResponse.json({ ok: true, emailVerified: decodedToken.email_verified === true });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ message: "Unable to finish account setup." }, { status: 500 });
  }
}