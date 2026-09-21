"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/auth/firebase";
import { acceptQuest, getQuestById } from "@/lib/db/quests";
import { useAuth } from "@/hooks/useAuth";
import type { Quest as FirestoreQuest } from "@/types/quest";
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

type PosterProfile = {
  fullName: string;
  profilePhotoUrl?: string | null;
  isVerified?: boolean;
  course?: string;
};

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ViewQuestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const questId = searchParams.get("id");
  const [quest, setQuest] = useState<FirestoreQuest | null>(null);
  const [poster, setPoster] = useState<PosterProfile | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuest() {
      if (!questId) {
        setLoading(false);
        return;
      }

      try {
        const nextQuest = await getQuestById(questId);
        if (!nextQuest) {
          setQuest(null);
          setLoading(false);
          return;
        }

        setQuest(nextQuest);
        const remainingMs = (nextQuest.expiresAt as { toDate?: () => Date } | undefined)?.toDate
          ? (nextQuest.expiresAt as { toDate: () => Date }).toDate().getTime() - Date.now()
          : 0;
        setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
        setAccepted(nextQuest.status === "accepted" || nextQuest.status === "completed");

        const requesterRef = await getDoc(doc(db, "users", nextQuest.requesterId));
        if (requesterRef.exists()) {
          const requesterData = requesterRef.data() as Partial<PosterProfile> & { fullName?: string };
          setPoster({
            fullName: requesterData.fullName ?? "QuestGo User",
            profilePhotoUrl: requesterData.profilePhotoUrl ?? null,
            isVerified: Boolean(requesterData.isVerified),
            course: requesterData.course,
          });
        } else {
          setPoster({ fullName: "QuestGo User" });
        }
      } catch (error) {
        console.error("Failed to load quest details:", error);
        setQuest(null);
      } finally {
        setLoading(false);
      }
    }

    void loadQuest();
  }, [questId]);

  useEffect(() => {
    if (!quest || accepted || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [quest, accepted, secondsLeft]);

  async function handleAccept() {
    if (!quest || !user || accepted || secondsLeft <= 0 || accepting) return;
    setAccepting(true);

    try {
      await acceptQuest(quest.id, user.uid);
      setAccepted(true);
      router.push(`/quests/active?id=${encodeURIComponent(quest.id)}`);
    } catch (error) {
      console.error("Failed to accept quest:", error);
      alert(error instanceof Error ? error.message : "Unable to accept this quest right now.");
    } finally {
      setAccepting(false);
    }
  }

  const expired = !accepted && secondsLeft <= 0;

  if (loading) {
    return <div className="page-container py-10 text-center text-[#161414]">Loading quest details...</div>;
  }

  if (!quest) {
    return <div className="page-container py-10 text-center text-[#161414]">Quest not found.</div>;
  }

  const posterName = poster?.fullName ?? "QuestGo User";
  const posterAvatar = poster?.profilePhotoUrl ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=QuestGo";
  const posterCompletedQuests = 0;

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-8 lg:py-12">
        {/* Back link */}
        <ScrollReveal>
          <Link
            href="/quests"
            className="
              inline-flex items-center gap-2 text-sm font-semibold text-[#4a4340]
              hover:text-[#7a1f32] transition-colors duration-300 mb-6
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ───────────── LEFT: QUEST DETAILS ───────────── */}
          <ScrollReveal className="lg:col-span-8">
            <article className="card-surface p-6 sm:p-8">
              {/* Category + verified */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-[#fdf0f2] text-[#7a1f32] text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase">
                  {quest.category}
                </span>
                <span className="badge-gold gap-1 !text-[10px]">
                  <CheckCircle2 className="w-3 h-3" />
                  CIT-U VERIFIED
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161414] mb-5 leading-tight">
                {quest.title}
              </h1>

              {/* Poster */}
              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-[#e5e0d8]">
                <Image
                  src={posterAvatar}
                  alt={posterName}
                  width={44}
                  height={44}
                  className="rounded-full bg-[#f4f2ef] shrink-0 object-cover"
                  unoptimized
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#161414]">
                    {posterName}
                  </p>
                  <p className="text-xs text-[#4a4340] flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
                    <span className="font-semibold text-[#161414]">4.8</span>
                    <span>({posterCompletedQuests} completed quests)</span>
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-[#161414] mb-2">
                  Task Description
                </h2>
                <p className="text-sm sm:text-base text-[#4a4340] leading-relaxed">
                  {quest.description}
                </p>
              </div>

              {/* Meta panel */}
              <div className="rounded-2xl bg-[#fbf8f0] border border-[#e5e0d8] p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#7a1f32]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                      Pickup Location
                    </p>
                    <p className="text-sm font-bold text-[#161414]">
                      {quest.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4 text-[#7a1f32]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                      Meet-up Location
                    </p>
                    <p className="text-sm font-bold text-[#161414]">
                      {quest.meetUpPoint}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-[#7a1f32]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                      Preferred Meet-up Time
                    </p>
                    <p className="text-sm font-bold text-[#161414]">
                      {quest.preferredTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4 text-[#7a1f32]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                      Payment Method
                    </p>
                    <p className="text-sm font-bold text-[#161414]">
                      Cash on Delivery (COD)
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* ───────────── RIGHT: REWARD + ACCEPT ───────────── */}
          <ScrollReveal delayMs={100} variant="scale" className="lg:col-span-4">
            <aside className="card-surface p-6 sticky top-6">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#7a1f32] mb-3">
                Quest Reward
              </p>

              <div className="flex items-end gap-2 mb-5">
                <span className="text-4xl font-extrabold text-[#c9a227] leading-none">
                  ₱{quest.reward}
                </span>
                <span className="text-sm text-[#4a4340] mb-1 font-medium">
                  Net Cash
                </span>
              </div>

              <div className="h-px bg-[#e5e0d8] mb-5" />

              {/* Expiry box */}
              <div
                className={`
                  rounded-xl border p-4 mb-4
                  ${
                    expired
                      ? "border-red-200 bg-red-50"
                      : accepted
                      ? "border-green-200 bg-[#eefbf3]"
                      : "border-[#f0e0a8] bg-[#fbf6e4]"
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Timer
                    className={`w-4 h-4 ${
                      expired
                        ? "text-red-600"
                        : accepted
                        ? "text-green-700"
                        : "text-[#c9a227]"
                    }`}
                  />
                  <p
                    className={`text-[11px] font-bold tracking-wide uppercase ${
                      expired
                        ? "text-red-700"
                        : accepted
                        ? "text-green-800"
                        : "text-[#8a6a1f]"
                    }`}
                  >
                    {accepted
                      ? "Quest Accepted"
                      : expired
                      ? "Expired"
                      : "Expires In"}
                  </p>
                </div>
                {!accepted && (
                  <p
                    className={`text-lg font-extrabold ${
                      expired ? "text-red-700" : "text-[#c9a227]"
                    }`}
                  >
                    {expired
                      ? "00:00 remaining"
                      : `${formatCountdown(secondsLeft)} remaining`}
                  </p>
                )}
                {accepted && (
                  <p className="text-sm font-semibold text-green-800">
                    You’re assigned as the Quest Runner.
                  </p>
                )}
              </div>

              {/* Note */}
              <div className="rounded-xl border border-[#e5e0d8] bg-[#fbf8f0] p-3.5 mb-5">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#7a1f32] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#4a4340] leading-relaxed">
                    Once accepted, this quest will be removed from Available
                    Quests and assigned to only one Quest Runner.
                  </p>
                </div>
              </div>

              {/* CTA */}
              {!accepted ? (
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={expired || accepting}
                  className="
                    btn-primary w-full justify-center text-[15px] py-3.5
                    disabled:opacity-60 disabled:hover:transform-none
                  "
                >
                  {expired
                    ? "Quest Expired"
                    : accepting
                    ? "Accepting..."
                    : "Accept Quest"}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => router.push("/messenger")}
                    className="btn-primary w-full justify-center text-[15px] py-3.5"
                  >
                    Open Chat with Poster
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/requests")}
                    className="
                      w-full rounded-xl border border-[#e5e0d8] bg-white
                      px-4 py-3 text-sm font-semibold text-[#4a4340]
                      hover:border-[#7a1f32] hover:text-[#7a1f32]
                      transition-all duration-300
                    "
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