"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Flag } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────────────────────── */
function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  variant = "fade-up" as "fade-up" | "scale",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "fade-up" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${variant === "scale" ? "reveal-scale" : "reveal"} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MOCK COMPLETION DATA
───────────────────────────────────────────────────────── */
const COMPLETION = {
  questTitle: "Print CPE Module",
  reward: "30",
  payment: "Cash on Delivery",
  completedAt: "4:52 PM",
  requester: {
    name: "Maria Santos",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
  },
  runner: {
    name: "John Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  },
};

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function QuestCompletedPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  async function handleConfirm() {
    if (confirming || confirmed) return;
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 800));
    setConfirming(false);
    setConfirmed(true);
  }

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-10 lg:py-14">
        <div className="flex justify-center">
          <ScrollReveal variant="scale" className="w-full max-w-lg">
            <section className="card-surface px-6 py-8 sm:px-8 sm:py-10 text-center">
              {/* Success icon */}
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-[#e7f8ee] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#d8f3e3] flex items-center justify-center">
                  <Check className="w-6 h-6 text-[#1f9d57] stroke-[2.5]" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161414] mb-2">
                {confirmed ? "Completion Confirmed!" : "Quest Completed!"}
              </h1>
              <p className="text-sm text-[#4a4340] mb-6 max-w-sm mx-auto leading-relaxed">
                {confirmed
                  ? "Thanks! Your confirmation has been recorded. You can rate the runner next."
                  : "Task completed successfully by the runner. Please review the details below."}
              </p>

              {/* Details panel */}
              <div className="rounded-2xl bg-[#fbf8f0] border border-[#e5e0d8] overflow-hidden text-left mb-6">
                {/* Quest */}
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-[#e5e0d8]">
                  <span className="text-sm text-[#4a4340]">Quest</span>
                  <span className="text-sm font-bold text-[#161414] text-right">
                    {COMPLETION.questTitle}
                  </span>
                </div>

                {/* Requester */}
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-[#e5e0d8]">
                  <span className="text-sm text-[#4a4340]">Requester</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Image
                      src={COMPLETION.requester.avatar}
                      alt={COMPLETION.requester.name}
                      width={28}
                      height={28}
                      className="rounded-full bg-white shrink-0"
                      unoptimized
                    />
                    <span className="text-sm font-semibold text-[#161414] truncate">
                      {COMPLETION.requester.name}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#1f9d57] shrink-0" />
                  </div>
                </div>

                {/* Quest Runner */}
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-[#e5e0d8]">
                  <span className="text-sm text-[#4a4340]">Quest Runner</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Image
                      src={COMPLETION.runner.avatar}
                      alt={COMPLETION.runner.name}
                      width={28}
                      height={28}
                      className="rounded-full bg-white shrink-0"
                      unoptimized
                    />
                    <span className="text-sm font-semibold text-[#161414] truncate">
                      {COMPLETION.runner.name}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#1f9d57] shrink-0" />
                  </div>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-[#e5e0d8]">
                  <span className="text-sm text-[#4a4340]">Reward</span>
                  <span className="text-sm font-bold text-[#c9a227] text-right">
                    ₱{COMPLETION.reward} {COMPLETION.payment}
                  </span>
                </div>

                {/* Completed at */}
                <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <span className="text-sm text-[#4a4340]">Completed at</span>
                  <span className="text-sm font-semibold text-[#161414]">
                    {COMPLETION.completedAt}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!confirmed ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="btn-primary w-full justify-center py-3.5 text-[15px]"
                  >
                    {confirming ? "Confirming..." : "Confirm Completion"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="
                      w-full inline-flex items-center justify-center gap-2
                      rounded-xl border-[1.5px] border-[#7a1f32] bg-white
                      px-6 py-3.5 font-semibold text-[15px] text-[#7a1f32]
                      hover:bg-[#fdf0f2] transition-all duration-300
                    "
                  >
                    <Flag className="w-4 h-4" />
                    Report an Issue
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* UPDATED: Navigates to /requests/rate */}
                  <button
                    type="button"
                    onClick={() => router.push("/requests/rate")}
                    className="btn-primary w-full justify-center py-3.5 text-[15px]"
                  >
                    Rate Quest Runner
                  </button>
                  <Link
                    href="/requests"
                    className="
                      w-full inline-flex items-center justify-center
                      rounded-xl border border-[#e5e0d8] bg-white
                      px-6 py-3.5 font-semibold text-[15px] text-[#4a4340]
                      hover:border-[#7a1f32] hover:text-[#7a1f32]
                      transition-all duration-300
                    "
                  >
                    Back to My Requests
                  </Link>
                </div>
              )}

              <p className="mt-4 text-xs text-[#4a4340] leading-relaxed">
                Both parties must confirm completion to finalize this quest.
              </p>
            </section>
          </ScrollReveal>
        </div>
      </div>

      {/* Report modal (UI only) */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="card-surface w-full max-w-md p-6 animate-fade-up text-left"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >
            <h2
              id="report-title"
              className="text-xl font-extrabold text-[#161414] mb-1"
            >
              Report an Issue
            </h2>
            <p className="text-sm text-[#4a4340] mb-5">
              Tell us what went wrong with this quest. Our safety team will review it.
            </p>

            <textarea
              rows={4}
              placeholder="Describe the issue..."
              className="
                w-full rounded-xl border border-[#e5e0d8] bg-white
                px-4 py-3 text-sm text-[#161414] placeholder:text-[#4a4340]/50
                outline-none transition-all duration-300 mb-5
                focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20
                resize-y
              "
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="
                  px-4 py-2.5 rounded-xl border border-[#e5e0d8] bg-white
                  text-sm font-semibold text-[#4a4340]
                  hover:border-[#7a1f32] hover:text-[#7a1f32]
                  transition-all duration-300
                "
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="btn-primary !py-2.5 !px-5 !text-sm"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}