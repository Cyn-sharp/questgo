"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/auth/firebase";
import { EyeIcon } from "@/components/ui/icons/EyeIcon";

export function ResetPasswordForm() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isValidCode, setIsValidCode] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const actionCode = params.get("oobCode") ?? "";
    setCode(actionCode);
    if (!actionCode) {
      setMessage("This password reset link is missing or invalid.");
      setIsCheckingCode(false);
      return;
    }
    verifyPasswordResetCode(auth, actionCode)
      .then((accountEmail) => {
        setEmail(accountEmail);
        setIsValidCode(true);
      })
      .catch(() => setMessage("This password reset link has expired or was already used."))
      .finally(() => setIsCheckingCode(false));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, code, password);
      setSuccess(true);
    } catch {
      setMessage("Unable to reset your password. Request a new reset link and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent p-4 sm:p-6">
      <section className="w-full max-w-[420px] rounded-2xl border border-white/40 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#f0d98e] bg-[#fffaf0] text-[#c99a16]">
          <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true">
            <rect x="7" y="14" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M11 14V10a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-center font-outfit text-xl font-extrabold text-maroon sm:text-[22px]">
          Create a New Password
        </h1>
        <p className="mt-2 text-center font-inter text-[12px] leading-4 text-muted sm:text-[13px]">
          Choose a password that is easy for you to remember and hard for others to guess.
        </p>
        {isCheckingCode ? (
          <div className="mt-5 rounded-lg bg-[#fbf8f0] px-3 py-3 text-center font-inter text-[12px] text-muted">
            Checking your secure reset link...
          </div>
        ) : null}
        {email ? (
          <p className="mt-4 text-center font-inter text-[12px] text-muted">
            Resetting password for <strong className="text-dark">{email}</strong>
          </p>
        ) : null}
        <form
          onSubmit={handleSubmit}
          className={`mt-5 space-y-3 ${isCheckingCode || !isValidCode ? "opacity-60" : ""}`}
        >
          <label className="block font-inter text-[12px] font-semibold text-dark">
            New Password
            <span className="mt-1 flex h-11 items-center rounded-lg border border-[#e8e7e3] bg-[#fbf8f0] px-3 transition-colors focus-within:border-maroon focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7a1f3233]">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent outline-none"
                required
                minLength={8}
                disabled={!isValidCode}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="ml-2 flex h-9 w-9 items-center justify-center rounded-md border border-[#e8e7e3] bg-white text-muted transition-all active:scale-95"
                aria-label={showPassword ? "Hide new password" : "Show new password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </span>
          </label>
          <label className="block font-inter text-[12px] font-semibold text-dark">
            Confirm New Password
            <span className="mt-1 flex h-11 items-center rounded-lg border border-[#e8e7e3] bg-[#fbf8f0] px-3 transition-colors focus-within:border-maroon focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7a1f3233]">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent outline-none"
                required
                minLength={8}
                disabled={!isValidCode}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="ml-2 flex h-9 w-9 items-center justify-center rounded-md border border-[#e8e7e3] bg-white text-muted transition-all active:scale-95"
                aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
              >
                <EyeIcon open={showConfirmPassword} />
              </button>
            </span>
          </label>
          <div className="rounded-lg bg-[#fbf8f0] p-3 font-inter text-[11px] leading-5 text-muted">
            <p className={password.length >= 8 ? "text-[#168552]" : ""}>
              ✓ At least 8 characters <span className="text-muted">(required)</span>
            </p>
            <p className={/\d/.test(password) ? "text-[#168552]" : ""}>
              ✓ A number <span className="text-muted">(recommended)</span>
            </p>
            <p className={/[!@#$%^&*]/.test(password) ? "text-[#168552]" : ""}>
              ✓ A special character <span className="text-muted">(recommended)</span>
            </p>
          </div>
          <button
            type="submit"
            disabled={!isValidCode || isCheckingCode || isSubmitting || success}
            className="h-11 w-full rounded-lg bg-maroon font-inter text-[12px] font-semibold text-white shadow-[0_8px_18px_#7a1f3226] transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? "RESETTING..." : "RESET PASSWORD"}
          </button>
        </form>
        {message ? (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center font-inter text-[12px] text-maroon">
            {message}
          </p>
        ) : null}
        {success ? (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-[#62d3a0] bg-[#edfff6] px-3 py-2.5 font-inter text-[12px] font-semibold text-[#26734d]">
            <span>Password Successfully Updated</span>
            <Link
              href="/login"
              className="shrink-0 rounded-md border border-[#62d3a0] bg-white px-3 py-1.5 text-[#26734d] transition-colors hover:bg-[#26734d] hover:text-white"
            >
              LOG IN
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}