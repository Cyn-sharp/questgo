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
import { fundingSummary, money } from "@/lib/quests/funding";
import { getQuestExpirationMillis } from "@/lib/db/quests";
import { useAvailableQuests, useQuestClock } from "@/hooks/useQuests";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Quest as FirestoreQuest } from "@/types/quest";
import { QuestGridSkeleton } from "@/components/skeletons/PageSkeletons";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";

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
  upfront: number | null;
  fundingLabel: string;
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
    upfront: fundingSummary(quest).upfront,
    fundingLabel: fundingSummary(quest).label,
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
        bg-white p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex flex-col
        hover:shadow-[0_18px_44px_rgba(0,0,0,0.35)]
        hover:bg-maroon-dark hover:border-gold/50
      "
    >
      <div className="relative z-[1] flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <span
            className="
              bg-[#fdf0f2] text-maroon text-xs sm:text-xs font-bold px-2.5 py-1 rounded-md
              tracking-wide uppercase transition-colors duration-500
              group-hover:bg-white/15 group-hover:text-gold-bright
            "
          >
            {quest.category}
          </span>
          <div
            className="
              flex items-center text-maroon text-xs sm:text-sm font-semibold gap-1.5
              transition-colors duration-500 group-hover:text-gold-bright
            "
          >
            <Clock className="w-3.5 h-3.5" />
            {quest.timeLeft}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base sm:text-lg font-bold text-dark mb-1.5 transition-colors duration-500 group-hover:text-white">
          {quest.title}
        </h3>
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-4 line-clamp-2 transition-colors duration-500 group-hover:text-white/75">
          {quest.description}
        </p>

        {/* Price */}
        <div className="flex items-end gap-2 mb-4 sm:mb-5">
          <span className="text-2xl sm:text-3xl font-extrabold text-gold-ink group-hover:text-gold-bright">₱{quest.price}</span>
          <span className="text-xs sm:text-xs text-muted mb-1 font-medium transition-colors duration-500 group-hover:text-white/70">
            Runner earnings
          </span>
        </div>

        <p className="mb-4 text-sm text-maroon group-hover:text-white">{quest.fundingLabel}<br />{quest.upfront === null ? "Upfront cost not recorded" : quest.upfront === 0 ? "₱0 upfront — earn without advancing money" : "Advance up to " + money(quest.upfront)}</p>
        {/* Location & Details */}
        <div className="flex flex-col gap-2 text-xs sm:text-xs text-muted mb-4 sm:mb-5 flex-grow transition-colors duration-500 group-hover:text-white/80">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold-bright transition-colors duration-500" />
            <span className="truncate">{quest.location}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold-bright transition-colors duration-500" />
              {quest.distance}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold-bright transition-colors duration-500" />
              {quest.time}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 text-dark font-bold text-xs sm:text-sm pt-1 transition-colors duration-500 group-hover:text-white">
            <Star className="w-3.5 h-3.5 text-gold-star fill-gold-star group-hover:text-gold-bright group-hover:fill-gold-bright" />
            {quest.rating}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 sm:pt-4 border-t border-border transition-colors duration-500 group-hover:border-white/20">
          <span className="badge-gold gap-1 text-xs sm:text-xs transition-colors duration-500 group-hover:bg-white/15 group-hover:text-gold-bright">
            <CheckCircle2 className="w-3 h-3" />
            CIT-U VERIFIED
          </span>
          <Link
            href={`/quests/viewquest?id=${encodeURIComponent(quest.id)}`}
            className="
              bg-maroon text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg
              transition-all duration-300 active:scale-95
              group-hover:bg-white group-hover:text-maroon
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
  const [zeroUpfront, setZeroUpfront] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const { records, isLoading: dataLoading, hasError, retry: loadQuests } = useAvailableQuests();
  const isLoading = useMinimumLoading(dataLoading) && !hasError;
  const now = useQuestClock();
  const quests = useMemo(() => records.filter((quest) => (getQuestExpirationMillis(quest) ?? 0) > now).map(toDisplayQuest).filter((quest): quest is Quest => quest !== null), [records, now]);

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

      return matchesCategory && matchesQuery && (!zeroUpfront || quest.upfront === 0);
    });
  }, [query, activeCategory, quests, zeroUpfront]);

  return (
    <div className="bg-transparent min-h-full">
      <div className="page-container py-6 sm:py-10 lg:py-12">
        {/* Title Header */}
        <ScrollReveal>
          <PageHeader
            eyebrow="Find a quest"
            title="Campus Quest Marketplace"
            description="Browse and claim quick tasks posted by other Wildcats. Quests stay open for 30 minutes."
          />
        </ScrollReveal>

        {/* Search & Category Filter Card */}
        <ScrollReveal delayMs={80}>
          <div className="rounded-2xl bg-white border border-white/40 p-4 sm:p-5 mb-6 sm:mb-8 shadow-[0_12px_32px_rgba(0,0,0,0.15)]">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search quests, categories, or tasks..."
                className="
                  w-full rounded-full border border-field bg-cream
                  pl-12 pr-4 py-3 text-sm text-dark placeholder:text-muted/80
                  outline-none transition-all duration-300
                  focus:border-gold focus:ring-2 focus:ring-gold/25
                "
              />
            </div>

            <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={zeroUpfront} onChange={(event) => setZeroUpfront(event.target.checked)} />₱0 upfront — no abono needed</label>
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
                          ? "bg-maroon text-white shadow-[0_8px_18px_rgba(122,31,50,0.25)]"
                          : "bg-white text-muted border border-border hover:border-maroon hover:text-maroon"
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
          <QuestGridSkeleton count={6} withDescription />
        ) : hasError ? (
          <div className="rounded-2xl bg-white border border-white/40 p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.15)]">
            <p className="text-base sm:text-lg font-bold text-dark mb-2">
              Unable to load quests right now.
            </p>
            <p className="text-sm text-muted mb-5">Please try again.</p>
            <button
              type="button"
              onClick={() => void loadQuests()}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-maroon hover:bg-maroon-dark text-white text-sm font-bold active:scale-95 transition-all shadow-[0_4px_12px_rgba(122,31,50,0.2)]"
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
            <div className="rounded-2xl bg-white border border-white/40 p-10 text-center shadow-[0_12px_32px_rgba(0,0,0,0.15)]">
              <p className="text-base sm:text-lg font-bold text-dark mb-2">
                No quests available right now.
              </p>
              <p className="text-sm text-muted mb-5">
                Check back later for new opportunities.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setZeroUpfront(false);
                  setActiveCategory("All");
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-maroon hover:bg-maroon-dark text-white text-sm font-bold active:scale-95 transition-all shadow-[0_4px_12px_rgba(122,31,50,0.2)]"
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