"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/auth/firebase";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setMessage("");
    if (!normalizedEmail.endsWith("@cit.edu") && !normalizedEmail.endsWith("@gmail.com")) {
      setMessage("Use a CIT-U or Gmail address for testing.");
      return;
    }

    setIsSending(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: false,
      });
      setSent(true);
      setMessage("Password reset link sent. Check your email Inbox, Junk, or Spam folder.");
    } catch {
      setMessage("We could not send a reset link for that account.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-5">
      <section className="w-full max-w-[360px] rounded-xl border border-[#e5e0d9] bg-white p-6 text-center shadow-[0_10px_24px_#0000000d] sm:p-7">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#f0d98e] bg-[#fffaf0] text-[#c99a16]">
          <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true"><rect x="7" y="14" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M11 14V10a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </div>
        <h1 className="mt-5 font-outfit text-[21px] font-extrabold text-maroon">Forgot Your Password?</h1>
        <p className="mt-2 font-inter text-[11px] leading-4 text-muted">Enter your email and we&apos;ll send you a password reset link.</p>
        <form onSubmit={handleSubmit} className="mt-5 text-left">
          <label htmlFor="reset-email" className="font-inter text-[11px] font-semibold text-dark">Email</label>
          <input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="studentname@cit.edu or Gmail" className="mt-1 h-10 w-full rounded-lg border border-[#e8e7e3] bg-[#fbf8f0] px-3 font-inter text-[12px] outline-none focus:border-maroon focus:ring-2 focus:ring-[#7a1f3233]" required />
          <button type="submit" disabled={isSending} className="mt-3 h-10 w-full rounded-lg bg-maroon font-inter text-[11px] font-semibold text-white disabled:opacity-60">{isSending ? "SENDING..." : "SEND RESET LINK"}</button>
        </form>
        {message ? <p role="status" className={`mt-4 font-inter text-[11px] leading-4 ${sent ? "text-[#26734d]" : "text-maroon"}`}>{message}</p> : null}
        <p className="mt-6 font-inter text-[11px] text-muted">Remember your password? <Link href="/login" className="font-semibold text-maroon hover:underline">Back to Login</Link></p>
        <p className="mt-5 border-t border-[#eee9df] pt-4 font-inter text-[10px] text-muted">Secured Firebase credential gateway.</p>
      </section>
    </main>
  );
}
