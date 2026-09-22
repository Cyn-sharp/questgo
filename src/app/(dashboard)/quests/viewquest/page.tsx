"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Banknote,
  ShieldCheck,
  Star,
  Timer,
} from "lucide-react";

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

const QUEST_DETAIL = {
  id: 1,
  category: "PRINTING",
  title: "Print CPE Module",
  description:
    "Please print pages 1–20 of my CPE module in black and white. Bond paper, short size. Make sure print is clean. We can meet right after my class.",
  price: "30",
  pickupLocation: "CIT-U Library",
  meetupLocation: "CIT-U Main Entrance",
  meetupTime: "4:30 PM",
  payment: "Cash on Delivery (COD)",
  expiresInSeconds: 29 * 60 + 42,
  poster: {
    name: "Maria Santos",
    rating: "4.8",
    completedQuests: 24,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
  },
};

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ViewQuestPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(QUEST_DETAIL.expiresInSeconds);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (accepted || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft, accepted]);

  async function handleAccept() {
    if (accepted || secondsLeft <= 0 || accepting) return;
    setAccepting(true);
    await new Promise((r) => setTimeout(r, 800));
    setAccepting(false);
    setAccepted(true);
    router.push("/quests/active");
  }

  const expired = secondsLeft <= 0 && !accepted;

  return (
    <div className="bg-transparent min-h-full">
      <div className="page-container py-6 sm:py-8 lg:py-12">
        <ScrollReveal>
          <Link
            href="/quests"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/95 hover:text-[#c9a227] active:scale-95 transition-all mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* LEFT: Details */}
          <ScrollReveal className="lg:col-span-8">
            <article className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-[#fdf0f2] text-[#7a1f32] text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase">
                  {QUEST_DETAIL.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f6ecc8] text-[#7a1f32] px-2.5 py-1 text-[10px] font-bold tracking-wide">
                  <CheckCircle2 className="w-3 h-3 text-[#7a1f32]" />
                  CIT-U VERIFIED
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#161414] mb-5 leading-tight">
                {QUEST_DETAIL.title}
              </h1>

              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-[#e5e0d8]">
                <Image
                  src={QUEST_DETAIL.poster.avatar}
                  alt={QUEST_DETAIL.poster.name}
                  width={44}
                  height={44}
                  className="rounded-full bg-[#f4f2ef] shrink-0"
                  unoptimized
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#161414]">{QUEST_DETAIL.poster.name}</p>
                  <p className="text-xs text-[#4a4340] flex items-center gap-1.5 flex-wrap">
                    <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
                    <span className="font-semibold text-[#161414]">{QUEST_DETAIL.poster.rating}</span>
                    <span>({QUEST_DETAIL.poster.completedQuests} completed)</span>
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-sm font-bold text-[#161414] mb-2">Task Description</h2>
                <p className="text-sm sm:text-base text-[#4a4340] leading-relaxed">
                  {QUEST_DETAIL.description}
                </p>
              </div>

              <div className="rounded-2xl bg-[#fbf8f0] border border-[#e5e0d8] p-4 sm:p-5 space-y-4">
                {[
                  { icon: MapPin, label: "Pickup Location", value: QUEST_DETAIL.pickupLocation },
                  { icon: Navigation, label: "Meet-up Location", value: QUEST_DETAIL.meetupLocation },
                  { icon: Clock, label: "Preferred Meet-up Time", value: QUEST_DETAIL.meetupTime },
                  { icon: Banknote, label: "Payment Method", value: QUEST_DETAIL.payment },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3 animate-fade-up">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#7a1f32]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                          {item.label}
                        </p>
                        <p className="text-sm font-bold text-[#161414] break-words">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </ScrollReveal>

          {/* RIGHT: Reward */}
          <ScrollReveal delayMs={100} variant="scale" className="lg:col-span-4">
            <aside className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] lg:sticky lg:top-6">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#7a1f32] mb-3">
                Quest Reward
              </p>

              <div className="flex items-end gap-2 mb-5">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#c9a227] leading-none">
                  ₱{QUEST_DETAIL.price}
                </span>
                <span className="text-sm text-[#4a4340] mb-1 font-medium">Net Cash</span>
              </div>

              <div className="h-px bg-[#e5e0d8] mb-5" />

              <div
                className={`
                  rounded-xl border p-4 mb-4
                  ${expired ? "border-red-200 bg-red-50" : accepted ? "border-green-200 bg-[#eefbf3]" : "border-[#f0e0a8] bg-[#fbf6e4]"}
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Timer className={`w-4 h-4 ${expired ? "text-red-600" : accepted ? "text-green-700" : "text-[#c9a227]"}`} />
                  <p className={`text-[11px] font-bold tracking-wide uppercase ${expired ? "text-red-700" : accepted ? "text-green-800" : "text-[#8a6a1f]"}`}>
                    {accepted ? "Quest Accepted" : expired ? "Expired" : "Expires In"}
                  </p>
                </div>
                {!accepted && (
                  <p className={`text-lg font-extrabold ${expired ? "text-red-700" : "text-[#c9a227]"}`}>
                    {expired ? "00:00 remaining" : `${formatCountdown(secondsLeft)} remaining`}
                  </p>
                )}
                {accepted && (
                  <p className="text-sm font-semibold text-green-800">
                    You&apos;re assigned as the Quest Runner.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-[#e5e0d8] bg-[#fbf8f0] p-3.5 mb-5">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#7a1f32] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#4a4340] leading-relaxed">
                    Once accepted, this quest will be removed from Available Quests and assigned to only one Quest Runner.
                  </p>
                </div>
              </div>

              {!accepted ? (
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={expired || accepting}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#7a1f32] hover:bg-[#5f1727] text-white font-bold text-[15px] shadow-[0_8px_18px_rgba(122,31,50,0.28)] transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {expired ? "Quest Expired" : accepting ? "Accepting..." : "Accept Quest"}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => router.push("/messenger")}
                    className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#7a1f32] hover:bg-[#5f1727] text-white font-bold text-[15px] shadow-[0_8px_18px_rgba(122,31,50,0.28)] transition-all active:scale-[0.98]"
                  >
                    Open Chat with Poster
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/requests")}
                    className="w-full rounded-xl border border-[#e5e0d8] bg-white px-4 py-3 text-sm font-semibold text-[#4a4340] hover:border-[#7a1f32] hover:text-[#7a1f32] active:scale-[0.98] transition-all"
                  >
                    Go to My Requests
                  </button>
                </div>
              )}
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}