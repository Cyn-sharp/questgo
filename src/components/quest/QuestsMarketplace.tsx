"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  MapPin,
  Navigation,
  Calendar,
  Star,
  CheckCircle2,
} from "lucide-react";
import { getAvailableQuests, getQuestExpirationMillis } from "@/lib/db/quests";
import type { Quest as FirestoreQuest } from "@/types/quest";

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL UTILITY
───────────────────────────────────────────────────────── */
function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  variant = "fade-up",
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
  TYPES & DISPLAY DATA
───────────────────────────────────────────────────────── */
type Category = "All" | "Printing" | "Pickup" | "Delivery" | "Shopping" | "Other";

type Quest = {
  id: string;
  expiresAt: number;
  category: Exclude<Category, "All">;
  timeLeft: string;
  title: string;
  description: string;
  price: string;
  location: string;
  distance: string;
  time: string;
  rating: string;
};

const CATEGORIES: Category[] = [
  "All",
  "Printing",
  "Pickup",
  "Delivery",
  "Shopping",
  "Other",
];

function formatTimeLeft(expiresAt: number): string {
  const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPreferredTime(value: string): string {
  return value || "Not specified";
}

function toDisplayQuest(quest: FirestoreQuest): Quest | null {
  const expiresAt = getQuestExpirationMillis(quest);
  if (quest.status !== "available" || expiresAt === null || expiresAt <= Date.now()) {
    return null;
  }

  return {
    id: quest.id,
    expiresAt,
    category: CATEGORIES.includes(quest.category as Category)
      ? (quest.category as Exclude<Category, "All">)
      : "Other",
    timeLeft: formatTimeLeft(expiresAt),
    title: quest.title,
    description: quest.description,
    price: String(quest.reward),
    location: quest.location,
    distance: "On campus",
    time: formatPreferredTime(quest.preferredTime),
    rating: "New",
  };
}

/* ─────────────────────────────────────────────────────────
   QUEST CARD COMPONENT
───────────────────────────────────────────────────────── */
function QuestCard({ quest }: { quest: Quest }) {
  return (
    <article
      className="
        group shine-wrap card-interactive h-full rounded-2xl border border-white/15
        bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex flex-col
        hover:shadow-[0_18px_44px_rgba(0,0,0,0.35)]
        hover:bg-[#5f1727] hover:border-[#c9a227]/50
      "
    >
      <div className="relative z-[1] flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <span
            className="
              bg-[#fdf0f2] text-[#7a1f32] text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-md
              tracking-wide uppercase transition-colors duration-500
              group-hover:bg-white/15 group-hover:text-[#c9a227]
            "
          >
            {quest.category}
          </span>
          <div
            className="
              flex items-center text-[#7a1f32] text-xs sm:text-sm font-semibold gap-1.5
              transition-colors duration-500 group-hover:text-[#c9a227]
            "
          >
            <Clock className="w-3.5 h-3.5" />
            {quest.timeLeft}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base sm:text-lg font-bold text-[#161414] mb-1.5 transition-colors duration-500 group-hover:text-white">
          {quest.title}
        </h3>
        <p className="text-xs sm:text-sm text-[#4a4340] leading-relaxed mb-4 line-clamp-2 transition-colors duration-500 group-hover:text-white/75">
          {quest.description}
        </p>

        {/* Price */}
        <div className="flex items-end gap-2 mb-4 sm:mb-5">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#c9a227]">₱{quest.price}</span>
          <span className="text-[11px] sm:text-xs text-[#4a4340] mb-1 font-medium transition-colors duration-500 group-hover:text-white/70">
            Cash on Delivery
          </span>
        </div>

        {/* Location & Details */}
        <div className="flex flex-col gap-2 text-[11px] sm:text-xs text-[#4a4340] mb-4 sm:mb-5 flex-grow transition-colors duration-500 group-hover:text-white/80">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#d8d3cc] group-hover:text-[#c9a227] transition-colors duration-500" />
            <span className="truncate">{quest.location}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 shrink-0 text-[#d8d3cc] group-hover:text-[#c9a227] transition-colors duration-500" />
              {quest.distance}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-[#d8d3cc] group-hover:text-[#c9a227] transition-colors duration-500" />
              {quest.time}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 text-[#161414] font-bold text-xs sm:text-sm pt-1 transition-colors duration-500 group-hover:text-white">
            <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
            {quest.rating}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 sm:pt-4 border-t border-[#e5e0d8] transition-colors duration-500 group-hover:border-white/20">
          <span className="badge-gold gap-1 text-[9px] sm:text-[10px] transition-colors duration-500 group-hover:bg-white/15 group-hover:text-[#c9a227]">
            <CheckCircle2 className="w-3 h-3" />
            CIT-U VERIFIED
          </span>
          <Link
            href={`/quests/viewquest?id=${encodeURIComponent(quest.id)}`}
            className="
              bg-[#7a1f32] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg
              transition-all duration-300 active:scale-95
              group-hover:bg-white group-hover:text-[#7a1f32]
            "
          >
            View Quest
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN MARKETPLACE COMPONENT
───────────────────────────────────────────────────────── */
export function QuestsMarketplace() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  async function loadQuests() {
    setIsLoading(true);
    setHasError(false);

    try {
      const nextQuests = (await getAvailableQuests())
        .map(toDisplayQuest)
        .filter((quest): quest is Quest => quest !== null);
      setQuests(nextQuests);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadQuests(), 0);

    const interval = window.setInterval(() => {
      setQuests((currentQuests) =>
        currentQuests
          .filter((quest) => quest.expiresAt > Date.now())
          .map((quest) => ({
            ...quest,
            timeLeft: formatTimeLeft(quest.expiresAt),
          })),
      );
    }, 30_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadQuests();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const filteredQuests = useMemo(() => {
    const q = query.trim().toLowerCase();

    return quests.filter((quest) => {
      const matchesCategory =
        activeCategory === "All" || quest.category === activeCategory;

      const matchesQuery =
        !q ||
        quest.title.toLowerCase().includes(q) ||
        quest.description.toLowerCase().includes(q) ||
        quest.category.toLowerCase().includes(q) ||
        quest.location.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, quests]);

  return (
    <div className="bg-transparent min-h-full">
      <div className="page-container py-6 sm:py-10 lg:py-12">
        {/* Title Header */}
        <ScrollReveal>
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
              Campus Quest Marketplace
            </h1>
            <p className="text-[#f6ecc8]/85 text-sm sm:text-base">
              Browse and claim quick gigs posted by other Wildcat students
            </p>
          </div>
        </ScrollReveal>

        {/* Search & Category Filter Card */}
        <ScrollReveal delayMs={80}>
          <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-4 sm:p-5 mb-6 sm:mb-8 shadow-[0_12px_32px_rgba(0,0,0,0.15)]">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4a4340]/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search quests, categories, or tasks..."
                className="
                  w-full rounded-full border border-[#e5e0d8] bg-[#fbf8f0]
                  pl-12 pr-4 py-3 text-sm text-[#161414] placeholder:text-[#4a4340]/60
                  outline-none transition-all duration-300
                  focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25
                "
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`
                      px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 active:scale-95
                      ${
                        isActive
                          ? "bg-[#7a1f32] text-white shadow-[0_8px_18px_rgba(122,31,50,0.25)]"
                          : "bg-white text-[#4a4340] border border-[#e5e0d8] hover:border-[#7a1f32] hover:text-[#7a1f32]"
                      }
                    `}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Quest Grid */}
        {isLoading ? (
          <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.15)]">
            <p className="text-base sm:text-lg font-bold text-[#161414]">Loading quests...</p>
          </div>
        ) : hasError ? (
          <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.15)]">
            <p className="text-base sm:text-lg font-bold text-[#161414] mb-2">
              Unable to load quests right now.
            </p>
            <p className="text-sm text-[#4a4340] mb-5">Please try again.</p>
            <button
              type="button"
              onClick={() => void loadQuests()}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#7a1f32] hover:bg-[#5f1727] text-white text-sm font-bold active:scale-95 transition-all shadow-[0_4px_12px_rgba(122,31,50,0.2)]"
            >
              Try again
            </button>
          </div>
        ) : filteredQuests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredQuests.map((quest, i) => (
              <ScrollReveal
                key={quest.id}
                delayMs={i * 65}
                variant="scale"
                className="h-full"
              >
                <QuestCard quest={quest} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.15)]">
              <p className="text-base sm:text-lg font-bold text-[#161414] mb-2">
                No quests available right now.
              </p>
              <p className="text-sm text-[#4a4340] mb-5">
                Check back later for new opportunities.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("All");
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#7a1f32] hover:bg-[#5f1727] text-white text-sm font-bold active:scale-95 transition-all shadow-[0_4px_12px_rgba(122,31,50,0.2)]"
              >
                Clear filters
              </button>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

export default QuestsMarketplace;