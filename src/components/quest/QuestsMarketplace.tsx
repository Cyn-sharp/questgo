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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
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
   TYPES & MOCK DATA
───────────────────────────────────────────────────────── */
type Category = "All" | "Printing" | "Pickup" | "Delivery" | "Shopping" | "Other";

type Quest = {
  id: number;
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

const MOCK_QUESTS: Quest[] = [
  {
    id: 1,
    category: "Printing",
    timeLeft: "29:42",
    title: "Print CPE Module",
    description:
      "Print a CPE module draft (black & white) and deliver it to the requester.",
    price: "30",
    location: "CIT-U Library",
    distance: "0.5 km away",
    time: "4:30 PM",
    rating: "4.8",
  },
  {
    id: 2,
    category: "Pickup",
    timeLeft: "18:15",
    title: "Pick Up Document",
    description:
      "Pick up a document from the registrar and bring it to the requester.",
    price: "50",
    location: "Main Campus",
    distance: "0.3 km away",
    time: "5:00 PM",
    rating: "4.5",
  },
  {
    id: 3,
    category: "Shopping",
    timeLeft: "25:08",
    title: "Buy School Supplies",
    description:
      "Buy notebooks, pens, and highlighters from the campus store.",
    price: "40",
    location: "CIT-U Main Campus",
    distance: "0.7 km away",
    time: "6:00 PM",
    rating: "4.9",
  },
  {
    id: 4,
    category: "Delivery",
    timeLeft: "12:30",
    title: "Deliver Lunch",
    description:
      "Pick up lunch from the cafeteria and deliver it to the requester.",
    price: "45",
    location: "Science Building",
    distance: "0.4 km away",
    time: "12:15 PM",
    rating: "4.6",
  },
  {
    id: 5,
    category: "Pickup",
    timeLeft: "08:12",
    title: "Return Library Book",
    description:
      "Return a borrowed book to the library before the deadline.",
    price: "25",
    location: "Main Library",
    distance: "0.2 km away",
    time: "3:00 PM",
    rating: "4.7",
  },
  {
    id: 6,
    category: "Printing",
    timeLeft: "28:50",
    title: "Print Thesis Draft",
    description:
      "Print a thesis draft (black & white) and deliver it to the requester.",
    price: "60",
    location: "CPE Lab",
    distance: "0.6 km away",
    time: "1:30 PM",
    rating: "5.0",
  },
];

/* ─────────────────────────────────────────────────────────
   QUEST CARD COMPONENT
───────────────────────────────────────────────────────── */
function QuestCard({ quest }: { quest: Quest }) {
  return (
    <article
      className="
        group shine-wrap card-interactive card-surface h-full p-6 flex flex-col
        hover:bg-[#7a1f32] hover:border-[#7a1f32]
        hover:shadow-[0_18px_44px_rgba(122,31,50,0.22)]
      "
    >
      <div className="relative z-[1] flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <span
            className="
              bg-[#fdf0f2] text-[#7a1f32] text-[11px] font-bold px-2.5 py-1 rounded-md
              tracking-wide uppercase transition-colors duration-500
              group-hover:bg-white/15 group-hover:text-[#c9a227]
            "
          >
            {quest.category}
          </span>
          <div
            className="
              flex items-center text-[#7a1f32] text-sm font-semibold gap-1.5
              transition-colors duration-500 group-hover:text-[#c9a227]
            "
          >
            <Clock className="w-3.5 h-3.5" />
            {quest.timeLeft}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-[#161414] mb-1.5 transition-colors duration-500 group-hover:text-white">
          {quest.title}
        </h3>
        <p className="text-sm text-[#4a4340] leading-relaxed mb-4 line-clamp-2 transition-colors duration-500 group-hover:text-white/75">
          {quest.description}
        </p>

        {/* Price */}
        <div className="flex items-end gap-2 mb-5">
          <span className="text-3xl font-extrabold text-[#c9a227]">₱{quest.price}</span>
          <span className="text-xs text-[#4a4340] mb-1 font-medium transition-colors duration-500 group-hover:text-white/70">
            Cash on Delivery
          </span>
        </div>

        {/* Location & Details */}
        <div className="flex flex-col gap-2 text-xs text-[#4a4340] mb-5 flex-grow transition-colors duration-500 group-hover:text-white/80">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#d8d3cc] group-hover:text-[#c9a227] transition-colors duration-500" />
            {quest.location}
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
          <div className="flex items-center justify-end gap-1 text-[#161414] font-bold text-sm pt-1 transition-colors duration-500 group-hover:text-white">
            <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
            {quest.rating}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#e5e0d8] transition-colors duration-500 group-hover:border-white/20">
          <span className="badge-gold gap-1 transition-colors duration-500 group-hover:bg-white/15 group-hover:text-[#c9a227]">
            <CheckCircle2 className="w-3 h-3" />
            CIT-U VERIFIED
          </span>
          {/* UPDATED: Link points to /quests/viewquest */}
          <Link
            href="/quests/viewquest"
            className="
              bg-[#7a1f32] text-white text-xs font-semibold px-4 py-2 rounded-lg
              transition-all duration-300
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

  const filteredQuests = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MOCK_QUESTS.filter((quest) => {
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
  }, [query, activeCategory]);

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-10 lg:py-12">
        {/* Title Header */}
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161414] mb-2">
              Campus Quest Marketplace
            </h1>
            <p className="text-[#4a4340] text-base">
              Browse and claim quick gigs posted by other Wildcat students
            </p>
          </div>
        </ScrollReveal>

        {/* Search & Category Filter Card */}
        <ScrollReveal delayMs={80}>
          <div className="card-surface p-4 sm:p-5 mb-8">
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
                      px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
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
        {filteredQuests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuests.map((quest, i) => (
              <ScrollReveal
                key={quest.id}
                delayMs={i * 80}
                variant="scale"
                className="h-full"
              >
                <QuestCard quest={quest} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <div className="card-surface p-10 text-center">
              <p className="text-lg font-bold text-[#161414] mb-2">
                No quests found
              </p>
              <p className="text-sm text-[#4a4340] mb-5">
                Try a different keyword or category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("All");
                }}
                className="btn-primary"
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