"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Star, Info, CheckCircle2 } from "lucide-react";

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
   PAGE
───────────────────────────────────────────────────────── */
export default function RateQuestPage() {
  const router = useRouter();
  const [rating, setRating] = useState<number>(4); // Default 4 stars matching screenshot
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const runnerName = "Maria Santos";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);

    // Redirect to requests after success
    setTimeout(() => {
      router.push("/requests");
    }, 1200);
  }

  function handleSkip() {
    router.push("/requests");
  }

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-10 lg:py-14">
        <div className="flex justify-center">
          <ScrollReveal variant="scale" className="w-full max-w-lg">
            <section className="card-surface px-6 py-8 sm:px-10 sm:py-10 text-center">
              {/* Header */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161414] mb-2">
                Rate Your Quest Experience
              </h1>
              <p className="text-sm text-[#4a4340] mb-8">
                How was your experience with{" "}
                <span className="font-bold text-[#161414]">{runnerName}</span>?
              </p>

              {/* Interactive Star Rating */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform duration-200 hover:scale-125 focus:outline-none"
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-9 h-9 transition-colors duration-200 ${
                          active
                            ? "text-[#c9a227] fill-[#c9a227]"
                            : "text-[#d8d3cc] fill-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="text-left space-y-6">
                <div>
                  <label
                    htmlFor="comment"
                    className="block text-sm font-semibold text-[#161414] mb-2"
                  >
                    Review Comment (Optional)
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="
                      w-full rounded-2xl border border-[#e5e0d8] bg-[#fbf8f0]/60
                      p-4 text-sm text-[#161414] placeholder:text-[#4a4340]/50
                      outline-none transition-all duration-300 resize-y min-h-[110px]
                      focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20
                      focus:bg-white
                    "
                  />
                </div>

                {/* Submit & Skip Buttons */}
                {!submitted ? (
                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full justify-center py-3.5 text-[15px] font-bold"
                    >
                      {submitting ? "Submitting..." : "Submit Rating"}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="
                          px-4 py-1.5 rounded-full border border-[#e5e0d8] bg-white
                          text-xs font-semibold text-[#4a4340]
                          hover:border-[#7a1f32] hover:text-[#7a1f32]
                          transition-all duration-300
                        "
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#eefbf3] border border-green-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-800 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Thank you! Rating submitted.
                    </div>
                  </div>
                )}
              </form>

              {/* Bottom Notice Banner */}
              <div className="mt-8 rounded-xl border border-[#f0e0a8] bg-[#fbf6e4] p-3.5 text-left flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#8a6a1f] shrink-0 mt-0.5" />
                <p className="text-xs text-[#8a6a1f] leading-relaxed">
                  Your rating helps build trust between students in the QuestGo
                  community.
                </p>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}