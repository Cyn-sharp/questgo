"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon } from "@/components/ui/icons/EyeIcon";

import { auth } from "@/lib/auth/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

type FieldErrors = {
  email?: string;
  password?: string;
};

const inputBase =
  "h-12 rounded-xl border px-3.5 font-inter text-sm font-medium text-[#161414] placeholder:text-gray-400 outline-none transition-colors";
const inputOk =
  "border-[#e8e7e3] bg-[#fbf8f0] focus:border-maroon focus:bg-white focus:ring-2 focus:ring-[#7a1f3233]";
const inputBad =
  "border-red-400 bg-red-50/70 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-200";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [errorTitle, setErrorTitle] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 500);
    return () => clearTimeout(t);
  }, [shake]);

  const attemptsLeft = useMemo(
    () => Math.max(0, 5 - failedAttempts),
    [failedAttempts]
  );

  const clearErrors = () => {
    setError("");
    setErrorTitle("");
    setFieldErrors({});
  };

  const triggerError = (opts: {
    title: string;
    message: string;
    fields?: FieldErrors;
    bumpAttempts?: boolean;
  }) => {
    setErrorTitle(opts.title);
    setError(opts.message);
    setFieldErrors(opts.fields ?? {});
    setShake(true);
    if (opts.bumpAttempts) setFailedAttempts((n) => n + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearErrors();

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      triggerError({
        title: "Missing details",
        message: "Please enter both your CIT-U email and password.",
        fields: {
          email: !trimmedEmail ? "Email is required." : undefined,
          password: !trimmedPassword ? "Password is required." : undefined,
        },
      });
      return;
    }

    if (!trimmedEmail.endsWith("@cit.edu")) {
      triggerError({
        title: "Use your CIT-U email",
        message: "Please use an active @cit.edu email address.",
        fields: { email: "Email must end with @cit.edu" },
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const { user } = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      setFailedAttempts(0);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Firebase Login Error:", err?.code, err?.message);

      if (
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/invalid-email"
      ) {
        triggerError({
          title: "Invalid email or password",
          message:
            "We couldn’t verify those credentials. Check your @cit.edu email and password, then try again.",
          fields: {
            email: "Check this email",
            password: "Check this password",
          },
          bumpAttempts: true,
        });
      } else if (err?.code === "auth/too-many-requests") {
        triggerError({
          title: "Too many attempts",
          message: "Please wait a few minutes, then try again.",
          bumpAttempts: true,
        });
      } else if (err?.code === "auth/network-request-failed") {
        triggerError({
          title: "Network error",
          message: "Check your internet connection and try again.",
        });
      } else {
        triggerError({
          title: "Login failed",
          message: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailHasError = Boolean(fieldErrors.email);
  const passwordHasError = Boolean(fieldErrors.password);

  return (
    <section
      className="flex w-full min-w-0 items-center justify-center bg-cream p-4 sm:p-8 lg:p-16"
      aria-labelledby="login-heading"
    >
      <div className="flex w-full max-w-[480px] flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1
            id="login-heading"
            className="font-outfit text-2xl font-extrabold leading-tight text-maroon sm:text-[32px]"
          >
            Log in to QuestGo
          </h1>
          <p className="font-inter text-[15px] text-muted">
            Continue helping. Continue earning.
          </p>
        </header>

        <form
          className={`flex flex-col gap-5 rounded-2xl border border-[#e5e0d9] bg-white p-5 shadow-[0_10px_24px_#00000012] sm:p-8 ${
            shake ? "animate-form-shake" : ""
          }`}
          onSubmit={handleSubmit}
          noValidate
        >
          {error ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 p-3.5"
              role="alert"
            >
              <p className="font-inter text-sm font-bold text-maroon">
                {errorTitle || "Login error"}
              </p>
              <p className="mt-1 font-inter text-[13px] leading-relaxed text-[#7a1f32]/90">
                {error}
              </p>
              {failedAttempts > 0 ? (
                <p className="mt-2 font-inter text-[12px] text-[#7a1f32]/80">
                  Failed attempts: <strong>{failedAttempts}</strong>
                  {failedAttempts < 5
                    ? ` • ${attemptsLeft} tries left`
                    : " • Consider resetting your password"}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cit-email"
                className="font-inter text-sm font-semibold text-dark"
              >
                CIT-U Email
              </label>
              <input
                id="cit-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="studentname@cit.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error || fieldErrors.email) clearErrors();
                }}
                className={`${inputBase} ${emailHasError ? inputBad : inputOk}`}
                aria-invalid={emailHasError}
                required
              />
              {fieldErrors.email ? (
                <p className="font-inter text-[12px] font-medium text-red-600">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="font-inter text-sm font-semibold text-dark"
              >
                Password
              </label>
              <div
                className={`flex h-12 items-center rounded-xl border transition-colors focus-within:bg-white focus-within:ring-2 ${
                  passwordHasError
                    ? "border-red-400 bg-red-50/70 focus-within:border-red-500 focus-within:ring-red-200"
                    : "border-[#e8e7e3] bg-[#fbf8f0] focus-within:border-maroon focus-within:ring-[#7a1f3233]"
                }`}
              >
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error || fieldErrors.password) clearErrors();
                  }}
                  className="h-full min-w-0 flex-1 bg-transparent px-3.5 font-inter text-sm font-medium text-[#161414] placeholder:text-gray-400 outline-none"
                  aria-invalid={passwordHasError}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="mr-3.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#e8e7e3] bg-white text-muted hover:text-dark focus:outline-none focus:ring-2 focus:ring-[#7a1f3233] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <span className="h-[18px] w-[18px]">
                    <EyeIcon open={showPassword} />
                  </span>
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="font-inter text-[12px] font-medium text-red-600">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 font-inter text-[13px] text-muted">
              <input
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 accent-maroon"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="font-inter text-[13px] font-semibold text-maroon hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-maroon px-6 py-3 font-inter text-[15px] font-semibold text-white shadow-[0_8px_18px_#7a1f3226] transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-2 disabled:opacity-60"
          >
            {isSubmitting ? "LOGGING IN..." : "LOG IN"}
          </button>

          <p className="text-center font-inter text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-maroon hover:underline"
            >
              Register
            </Link>
          </p>
        </form>

        <footer className="border-t border-[#e8e7e3] pt-4 text-center font-inter text-xs text-muted">
          &#10003; Verified CIT-U students only. Requires an active @cit.edu
          domain.
        </footer>
      </div>
    </section>
  );
}