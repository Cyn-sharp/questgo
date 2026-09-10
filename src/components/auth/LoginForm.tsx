"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon } from "@/components/ui/icons/EyeIcon";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your CIT-U email and password.");
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@cit.edu")) {
      setError("Please use an active @cit.edu email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.message ??
            (response.status === 404
              ? "Login service is not configured yet."
              : "Invalid email or password.")
        );
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex w-full min-w-0 items-center justify-center bg-cream p-4 sm:p-8 lg:p-16" aria-labelledby="login-heading">
      <div className="flex w-full max-w-[480px] flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 id="login-heading" className="font-outfit text-2xl font-extrabold leading-tight text-maroon sm:text-[32px]">
            Log in to QuestGo
          </h1>
          <p className="font-inter text-[15px] text-muted">Continue helping. Continue earning.</p>
        </header>

        <form className="flex flex-col gap-5 rounded-2xl border border-[#e5e0d9] bg-white p-5 shadow-[0_10px_24px_#00000012] sm:p-8" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cit-email" className="font-inter text-sm font-semibold text-dark">CIT-U Email</label>
              <input
                id="cit-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="studentname@cit.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-xl border border-[#e8e7e3] bg-cream px-3.5 font-inter text-sm outline-none focus:border-maroon focus:ring-2 focus:ring-[#7a1f3233]"
                aria-describedby={error ? "login-error" : undefined}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-inter text-sm font-semibold text-dark">Password</label>
              <div className="flex h-12 items-center rounded-xl border border-[#e8e7e3] bg-cream focus-within:border-maroon focus-within:ring-2 focus-within:ring-[#7a1f3233]">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent px-3.5 font-inter text-sm outline-none"
                  aria-describedby={error ? "login-error" : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="mr-3.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#e8e7e3] bg-white text-muted focus:outline-none focus:ring-2 focus:ring-[#7a1f3233]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <span className="h-[18px] w-[18px]"><EyeIcon open={showPassword} /></span>
                </button>
              </div>
            </div>
          </div>

          {error ? <p id="login-error" className="font-inter text-[13px] text-maroon" role="alert">{error}</p> : null}

          <div className="flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 font-inter text-[13px] text-muted">
              <input
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 accent-maroon"
              />
              Remember me
            </label>
            <a href="/forgot-password" className="font-inter text-[13px] font-semibold text-maroon focus:outline-none focus:underline">Forgot password?</a>
          </div>

          <button type="submit" disabled={isSubmitting} className="h-12 rounded-xl bg-maroon px-6 py-3 font-inter text-[15px] font-semibold text-white shadow-[0_8px_18px_#7a1f3226] transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-2 disabled:opacity-60">
            {isSubmitting ? "LOGGING IN..." : "LOG IN"}
          </button>

          <p className="text-center font-inter text-sm text-muted">
            Don&apos;t have an account? <Link href="/register" className="font-semibold text-maroon focus:outline-none focus:underline">Register</Link>
          </p>
        </form>

        <footer className="border-t border-[#e8e7e3] pt-4 text-center font-inter text-xs text-muted">
          &#10003; Verified CIT-U students only. Requires an active @cit.edu domain.
        </footer>
      </div>
    </section>
  );
}
