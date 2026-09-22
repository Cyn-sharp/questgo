"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth/firebase";
import { sendEmailVerification, signOut } from "firebase/auth";

type VerificationPendingProps = {
  email: string;
};

export function VerificationPending({ email }: VerificationPendingProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let active = true;
    const checkVerification = async () => {
      if (!auth.currentUser) return;
      try {
        await auth.currentUser.reload();
        if (active && auth.currentUser.emailVerified) {
          setIsVerified(true);
          router.replace("/login?verified=1");
        }
      } catch {
        if (active) setMessage("We could not check your verification status. Please try again.");
      }
    };
    void checkVerification();
    const interval = window.setInterval(() => void checkVerification(), 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [router]);

  const resend = async () => {
    if (!auth.currentUser) {
      setMessage("Your registration session ended. Please log in to resend the link.");
      return;
    }

    setIsSending(true);
    setMessage("");
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("A new verification link was sent. Check your inbox, Junk, or Spam folder.");
    } catch (error: any) {
      setMessage(
        error?.code === "auth/too-many-requests"
          ? "Too many requests. Please wait a few minutes before trying again."
          : "We could not send a new verification link. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const continueToLogin = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent p-4 sm:p-6">
      <section className="w-full max-w-[400px] rounded-2xl border border-white/40 bg-white p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf8f0] text-maroon">
          <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
            <rect x="4" y="8" width="24" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="m5.5 10 10.5 8 10.5-8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="mt-5 font-outfit text-xl font-extrabold text-maroon sm:text-[22px]">
          Verify Your Email
        </h1>
        <p className="mt-2 font-inter text-[12px] leading-[16px] text-muted sm:text-[13px]">
          QuestGo is ready for your account. Verify your email to continue.
        </p>
        <p className="mt-4 truncate rounded-lg bg-[#fbf8f0] px-3 py-2.5 font-inter text-[13px] font-semibold text-dark">
          {email}
        </p>
        <span className="mt-3 inline-flex rounded-full bg-[#fff8df] px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.08em] text-[#aa7b00]">
          {isVerified ? "Verified" : "Verification pending"}
        </span>
        <p className="mt-5 font-inter text-[12px] leading-[16px] text-muted sm:text-[13px]">
          Please check your email and click the verification link to activate your QuestGo account.
        </p>
        <button
          type="button"
          onClick={resend}
          disabled={isSending || isVerified}
          className="mt-5 h-11 w-full rounded-lg bg-maroon font-inter text-[12px] font-semibold text-white shadow-[0_8px_18px_#7a1f3226] transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          {isSending ? "SENDING..." : "RESEND VERIFICATION EMAIL"}
        </button>
        <button
          type="button"
          onClick={continueToLogin}
          className="mt-2 h-11 w-full rounded-lg border border-maroon font-inter text-[12px] font-semibold text-maroon transition-colors hover:bg-cream active:scale-[0.98]"
        >
          {isVerified ? "CONTINUE TO LOGIN" : "CHANGE EMAIL"}
        </button>
        {message ? (
          <p role="status" className="mt-3 font-inter text-[12px] leading-4 text-maroon">
            {message}
          </p>
        ) : null}
        <p className="mt-6 border-t border-[#eee9df] pt-4 font-inter text-[10px] text-muted">
          Need assistance? Contact your Wildcat Support team.
        </p>
        <Link
          href="/login"
          className="mt-2 inline-block font-inter text-[12px] font-semibold text-maroon hover:underline"
        >
          Back to Login
        </Link>
      </section>
    </main>
  );
}