"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  History,
  Wallet,
  LifeBuoy,
  Bell,
  Settings,
  ChevronRight,
  ChevronDown,
  Pencil,
  LogOut,
  Trophy,
  Send,
  Coins,
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

/* ─────────────────────────────────────────────────────────
   MOCK PROFILE DATA
───────────────────────────────────────────────────────── */
const PROFILE = {
  name: "Dave Alinson",
  course: "BS Computer Engineering Student",
  rating: "4.8",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dave",
  verified: true,
  stats: {
    completed: 47,
    posted: 12,
    earnings: "1,250",
  },
};

const COURSES = [
  "BS Computer Engineering Student",
  "BS Computer Science Student",
  "BS Information Technology Student",
  "BS Information Systems Student",
  "BS Civil Engineering Student",
  "BS Electrical Engineering Student",
  "BS Mechanical Engineering Student",
  "BS Architecture Student",
  "BS Accountancy Student",
  "BS Business Administration Student",
  "BS Hospitality Management Student",
];

const MENU_ITEMS = [
  {
    id: "verification",
    title: "Verification",
    description: "Verified via CIT-U ID",
    href: "/profile/verification",
    icon: ShieldCheck,
    iconBg: "bg-[#f6f0e8]",
    iconColor: "text-[#7a1f32]",
  },
  {
    id: "history",
    title: "Quest History",
    description: "View your completed and active logs",
    href: "/history",
    icon: History,
    iconBg: "bg-[#fbf0d6]",
    iconColor: "text-[#c9a227]",
  },
  {
    id: "wallet",
    title: "Quest Wallet",
    description: "Manage your completed earnings and options",
    href: "/profile/wallet",
    icon: Wallet,
    iconBg: "bg-[#fdecec]",
    iconColor: "text-[#7a1f32]",
  },
  {
    id: "safety",
    title: "Safety Center",
    description: "Rules, public meetups and code of conduct",
    href: "/safety",
    icon: LifeBuoy,
    iconBg: "bg-[#f6f0e8]",
    iconColor: "text-[#7a1f32]",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure chat and alert systems",
    href: "/notifications",
    icon: Bell,
    iconBg: "bg-[#f4f2ef]",
    iconColor: "text-[#4a4340]",
  },
  {
    id: "settings",
    title: "Settings",
    description: "Adjust password and profile settings",
    href: "/profile/settings",
    icon: Settings,
    iconBg: "bg-[#f4f2ef]",
    iconColor: "text-[#4a4340]",
  },
] as const;

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  function handleSignOut() {
    router.push("/");
  }

  return (
    <div className="bg-transparent min-h-full">
      <div className="page-container py-6 sm:py-10 lg:py-12">
        {/* ───── Profile Hero Card ───── */}
        <ScrollReveal>
          <section className="relative rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.3)] mb-4 sm:mb-5">
            {/* Banner strip — rounded only on top so avatar can hang over cleanly */}
            <div className="relative h-16 sm:h-20 rounded-t-2xl overflow-hidden bg-gradient-to-br from-[#7a1f32] via-[#5f1727] to-[#380913]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(201,162,39,0.25)_0%,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,255,255,0.08)_0%,transparent_40%)]" />
            </div>

            {/* Content below banner */}
            <div className="relative px-5 sm:px-6 pt-10 sm:pt-12 pb-5 sm:pb-6 bg-white rounded-b-2xl">
              {/* Avatar — pulled up to overlap banner, but NOT clipping text */}
              <div className="relative -mt-14 sm:-mt-16 mb-3 sm:mb-0">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 min-w-0">
                    {/* Avatar circle */}
                    <div className="relative shrink-0">
                      <Image
                        src={PROFILE.avatar}
                        alt={PROFILE.name}
                        width={96}
                        height={96}
                        className="rounded-full bg-white border-4 border-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] w-20 h-20 sm:w-24 sm:h-24"
                        unoptimized
                      />
                      {PROFILE.verified && (
                        <span className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#c9a227] border-[3px] border-white flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Name + meta — sits fully in white area, never clipped */}
                    <div className="min-w-0 sm:pb-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl md:text-[28px] font-extrabold text-[#161414] leading-tight">
                          {PROFILE.name}
                        </h1>

                        {PROFILE.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#f6ecc8] text-[#7a1f32] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide uppercase shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                        <span className="inline-flex items-center gap-1 font-bold text-[#161414]">
                          <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
                          {PROFILE.rating}
                          <span className="text-[#4a4340] font-normal ml-0.5">rating</span>
                        </span>
                        <span className="text-[#d8d3cc]">•</span>
                        <span className="text-[#4a4340]">{PROFILE.course}</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="
                      inline-flex items-center justify-center gap-2
                      rounded-xl bg-[#7a1f32] hover:bg-[#5f1727]
                      text-white text-sm font-bold
                      px-5 py-2.5 transition-all duration-300
                      shadow-[0_8px_18px_rgba(122,31,50,0.28)]
                      active:scale-[0.98] shrink-0
                      w-full sm:w-auto sm:mb-1
                    "
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ───── Stats Row ───── */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-4 sm:mb-5">
          {[
            {
              label: "Completed",
              value: PROFILE.stats.completed,
              icon: Trophy,
              accentClass: "from-[#7a1f32] to-[#5f1727]",
              valueClass: "text-[#7a1f32]",
              iconBg: "bg-[#fdf0f2]",
            },
            {
              label: "Posted",
              value: PROFILE.stats.posted,
              icon: Send,
              accentClass: "from-[#161414] to-[#4a4340]",
              valueClass: "text-[#161414]",
              iconBg: "bg-[#f4f2ef]",
            },
            {
              label: "Earnings",
              value: `₱${PROFILE.stats.earnings}`,
              icon: Coins,
              accentClass: "from-[#c9a227] to-[#b08b1e]",
              valueClass: "text-[#c9a227]",
              iconBg: "bg-[#f6ecc8]",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal key={stat.label} delayMs={i * 80} variant="scale">
                <article
                  className="
                    group shine-wrap card-interactive relative overflow-hidden
                    rounded-2xl border border-white/40 bg-white/95 backdrop-blur-md
                    p-3 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]
                    hover:shadow-[0_16px_36px_rgba(0,0,0,0.2)]
                  "
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.accentClass}`} />

                  <div className="relative z-[1]">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${stat.iconBg} flex items-center justify-center mb-2 sm:mb-3`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.valueClass}`} />
                    </div>
                    <p className={`text-lg sm:text-2xl md:text-3xl font-extrabold leading-none ${stat.valueClass}`}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-[#4a4340] mt-1 sm:mt-2 truncate">
                      {stat.label}
                    </p>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>

        {/* ───── Menu List ───── */}
        <ScrollReveal delayMs={120}>
          <section className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 shadow-[0_12px_32px_rgba(0,0,0,0.15)] overflow-hidden">
            <ul className="divide-y divide-[#e5e0d8]">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="
                        group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4
                        transition-all duration-300
                        hover:bg-[#fbf8f0] active:bg-[#f6f0e8]
                      "
                    >
                      <div
                        className={`
                          w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0
                          transition-transform duration-300 group-hover:scale-105 group-active:scale-95
                          ${item.iconBg}
                        `}
                      >
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-bold text-[#161414] group-hover:text-[#7a1f32] transition-colors duration-300">
                          {item.title}
                        </p>
                        <p className="text-[11px] sm:text-sm text-[#4a4340] truncate">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight
                        className="
                          w-5 h-5 text-[#d8d3cc] shrink-0
                          transition-all duration-300
                          group-hover:text-[#7a1f32] group-hover:translate-x-0.5
                        "
                      />
                    </Link>
                  </li>
                );
              })}

              {/* Sign Out Row */}
              <li>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="
                    w-full text-left group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4
                    transition-all duration-300
                    hover:bg-[#fdecec]/50 active:bg-[#fdecec]
                  "
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#fdecec] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-[#b42318]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold text-[#b42318]">
                      Sign Out
                    </p>
                    <p className="text-[11px] sm:text-sm text-[#4a4340] truncate">
                      Log out of your QuestGo account
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#d8d3cc] shrink-0 transition-all duration-300 group-hover:text-[#b42318] group-hover:translate-x-0.5" />
                </button>
              </li>
            </ul>
          </section>
        </ScrollReveal>

        <p className="mt-6 text-center text-[11px] text-white/60 font-medium">
          QuestGo v1.0 · CIT-U Campus
        </p>

        {/* ───── Edit Modal ───── */}
        {editOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-[3px]"
            onClick={() => setEditOpen(false)}
          >
            <div
              className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 w-full max-w-md p-5 sm:p-6 animate-fade-up shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-profile-title"
            >
              <h2
                id="edit-profile-title"
                className="text-lg sm:text-xl font-extrabold text-[#161414] mb-1"
              >
                Edit Profile
              </h2>
              <p className="text-xs sm:text-sm text-[#4a4340] mb-5">
                Update your public QuestGo identity details.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#161414] mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    defaultValue={PROFILE.name}
                    className="
                      w-full rounded-xl border border-[#e5e0d8] bg-white
                      px-4 py-3 text-sm text-[#161414]
                      outline-none transition-all duration-300
                      focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20
                    "
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#161414] mb-1.5">
                    Course / Program
                  </label>
                  <div className="relative">
                    <select
                      defaultValue={PROFILE.course}
                      className="
                        w-full appearance-none rounded-xl border border-[#e5e0d8] bg-white
                        px-4 py-3 pr-10 text-sm text-[#161414] cursor-pointer
                        outline-none transition-all duration-300
                        focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20
                      "
                    >
                      {COURSES.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4a4340]/55" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="
                    px-4 py-2.5 rounded-xl border border-[#e5e0d8] bg-white
                    text-sm font-semibold text-[#4a4340]
                    hover:border-[#7a1f32] hover:text-[#7a1f32]
                    active:scale-95 transition-all
                  "
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#7a1f32] hover:bg-[#5f1727] text-white text-sm font-bold shadow-[0_4px_12px_rgba(122,31,50,0.2)] active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}