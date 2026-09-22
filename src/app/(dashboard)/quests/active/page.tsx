"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/hooks/useAuth";
import { getQuestById, markQuestCompleted } from "@/lib/db/quests";
import type { Quest as FirestoreQuest } from "@/types/quest";
import {
  CheckCircle2,
  Lock,
  MessageSquare,
  MapPin,
  Navigation,
  Clock,
  Banknote,
  ShieldCheck,
  Star,
  Check,
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

type QuestPoster = {
  fullName: string;
  profilePhotoUrl?: string | null;
  isVerified?: boolean;
  averageRating?: number | null;
  ratingCount?: number;
};

export default function ActiveQuestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const questId = searchParams.get("id");
  const [quest, setQuest] = useState<FirestoreQuest | null>(null);
  const [poster, setPoster] = useState<QuestPoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    async function loadAcceptedQuest() {
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

        const requesterRef = await getDoc(doc(db, "users", nextQuest.requesterId));
        if (requesterRef.exists()) {
          const requesterData = requesterRef.data() as {
            fullName?: string;
            profilePhotoUrl?: string | null;
            isVerified?: boolean;
            averageRating?: number | null;
            ratingCount?: number;
          };
          setPoster({
            fullName: requesterData.fullName ?? "QuestGo User",
            profilePhotoUrl: requesterData.profilePhotoUrl ?? null,
            isVerified: Boolean(requesterData.isVerified),
            averageRating: typeof requesterData.averageRating === "number" ? requesterData.averageRating : 0,
            ratingCount: typeof requesterData.ratingCount === "number" ? requesterData.ratingCount : 0,
          });
        } else {
          setPoster({ fullName: "QuestGo User", averageRating: 0, ratingCount: 0 });
        }
      } catch (error) {
        console.error("Failed to load accepted quest:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadAcceptedQuest();
  }, [questId]);

  async function handleMarkCompleted() {
    if (!quest || !user) return;

    setCompleting(true);

    try {
      await markQuestCompleted(quest.id, user.uid);
      router.push(`/requests/completed?id=${encodeURIComponent(quest.id)}`);
    } catch (error) {
      console.error("Failed to complete quest:", error);
      alert(error instanceof Error ? error.message : "Unable to complete this quest yet.");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return <div className="page-container py-10 text-center text-[#161414]">Loading your accepted quest...</div>;
  }

  if (!quest) {
    return <div className="page-container py-10 text-center text-[#161414]">Accepted quest not found.</div>;
  }

  const posterName = poster?.fullName ?? "QuestGo User";
  const posterAvatar = poster?.profilePhotoUrl ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=QuestGo";
  const posterAverageRating = poster && typeof poster.averageRating === "number" ? poster.averageRating : 0;
  const posterRatingCount = poster && typeof poster.ratingCount === "number" ? poster.ratingCount : 0;
  const posterRatingText = posterAverageRating > 0 ? posterAverageRating.toFixed(1) : "New";
  const posterRatingMeta = posterAverageRating > 0 ? `(${posterRatingCount} rating${posterRatingCount === 1 ? "" : "s"})` : "(No ratings yet)";

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-8 lg:py-12">
        {/* ───── TOP ACCEPTED BANNER ───── */}
        <ScrollReveal>
          <div className="mb-6 rounded-2xl border border-[#f0e0a8] bg-[#fbf6e4] px-5 py-4 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f6ecc8] flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-[#7a1f32] stroke-[2.5]" />
            </div>
            <p className="text-sm font-medium text-[#4a4340] leading-relaxed">
              <span className="font-bold text-[#7a1f32]">Quest Accepted ✓</span>{" "}
              You are now the official Runner for this quest. Finish the task and
              collect your reward.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ───────────── LEFT: QUEST DETAILS CARD ───────────── */}
          <ScrollReveal className="lg:col-span-8">
            <article className="card-surface p-6 sm:p-8">
              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-[#fbf0d6] text-[#8a6a1f] text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase">
                  {quest.status.toUpperCase()}
                </span>
                <span className="bg-[#fdf0f2] text-[#7a1f32] text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase">
                  {quest.category}
                </span>
              </div>

              {/* Locked Tag */}
              <div className="inline-flex items-center gap-1.5 bg-[#fbf6e4] border border-[#f0e0a8] px-2.5 py-1 rounded-full text-[11px] font-bold text-[#8a6a1f] mb-4">
                <Lock className="w-3 h-3 text-[#8a6a1f]" />
                <span>Locked</span>
              </div>

              {/* Quest Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161414] mb-6 leading-tight">
                {quest.title}
              </h1>

              {/* Requester Identity */}
              <div className="flex items-center gap-3.5 pb-6 mb-6 border-b border-[#e5e0d8]">
                <Image
                  src={posterAvatar}
                  alt={posterName}
                  width={48}
                  height={48}
                  className="rounded-full bg-[#f4f2ef] shrink-0 object-cover"
                  unoptimized
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-base font-bold text-[#161414]">
                      {posterName}
                    </p>
                    {poster?.isVerified && (
                      <span className="inline-flex items-center gap-1 bg-[#fbf0d6] text-[#8a6a1f] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4a4340] flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
                    <span className="font-semibold text-[#161414]">{posterRatingText}</span>
                    <span>{posterRatingMeta}</span>
                    <span className="text-[#d8d3cc]">•</span>
                    <span className="font-medium text-[#4a4340]">Requester</span>
                  </p>
                </div>
              </div>

              {/* Details Box */}
              <div className="rounded-2xl bg-[#fbf8f0] border border-[#e5e0d8] p-5 sm:p-6 space-y-4 mb-8">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#7a1f32]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                      Pickup Location
                    </p>
                    <p className="text-sm font-bold text-[#161414] inline-flex items-center gap-1.5 mt-0.5">
                      {quest.location}
                      <Lock className="w-3 h-3 text-[#4a4340]/60" />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0 mt-0.5">
                    <Navigation className="w-4 h-4 text-[#7a1f32]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                      Meet-up Location
                    </p>
                    <p className="text-sm font-bold text-[#161414] inline-flex items-center gap-1.5 mt-0.5">
                      {quest.meetUpPoint}
                      <Lock className="w-3 h-3 text-[#4a4340]/60" />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-[#7a1f32]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                      Preferred Meet-up Time
                    </p>
                    <p className="text-sm font-bold text-[#161414] mt-0.5">
                      {quest.preferredTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e0d8] flex items-center justify-center shrink-0 mt-0.5">
                    <Banknote className="w-4 h-4 text-[#7a1f32]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4a4340]/80">
                      Payment Method
                    </p>
                    <p className="text-sm font-bold text-[#161414] mt-0.5">
                      Cash on Delivery (COD)
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/messenger"
                  className="
                    inline-flex items-center justify-center gap-2 rounded-xl
                    border-[1.5px] border-[#7a1f32] bg-white
                    px-6 py-3.5 font-bold text-sm text-[#7a1f32]
                    hover:bg-[#fdf0f2] transition-all duration-300
                    hover:-translate-y-0.5
                  "
                >
                  <MessageSquare className="w-4 h-4 text-[#7a1f32]" />
                  Open Messenger
                </Link>

                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  disabled={completing}
                  className="
                    btn-primary justify-center text-sm py-3.5 font-bold
                    hover:-translate-y-0.5 disabled:opacity-60
                  "
                >
                  {completing ? "Updating..." : "Mark as Completed"}
                </button>
              </div>

              <p className="mt-4 text-xs text-[#4a4340]/80 text-center sm:text-left">
                Quest details and reward are locked after acceptance.
              </p>
            </article>
          </ScrollReveal>

          {/* ───────────── RIGHT: REWARD SIDEBAR ───────────── */}
          <ScrollReveal delayMs={100} variant="scale" className="lg:col-span-4">
            <aside className="card-surface p-6 sticky top-6">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#7a1f32] mb-3">
                Reward Amount
              </p>

              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-extrabold text-[#c9a227] leading-none">
                  ₱{quest.reward}
                </span>
                <span className="text-sm text-[#4a4340] mb-1 font-medium inline-flex items-center gap-1">
                  Net Cash <Lock className="w-3 h-3 text-[#4a4340]/60" />
                </span>
              </div>

              <div className="h-px bg-[#e5e0d8] mb-6" />

              {/* Exclusive Active Quest Notice */}
              <div className="rounded-2xl border border-[#f0e0a8] bg-[#fbf6e4] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#7a1f32] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold tracking-wider uppercase text-[#7a1f32] mb-1">
                      Exclusive Active Quest
                    </p>
                    <p className="text-xs text-[#4a4340] leading-relaxed">
                      This quest is assigned exclusively to you. No other Quest
                      Runner can accept it.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}