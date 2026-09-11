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
    // Navigates directly back to the public landing page (/)
    router.push("/");
  }

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-10 lg:py-12">
        {/* ───── Profile Header Card ───── */}
        <ScrollReveal>
          <section className="card-surface p-5 sm:p-6 mb-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: avatar + identity */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <Image
                    src={PROFILE.avatar}
                    alt={PROFILE.name}
                    width={88}
                    height={88}
                    className="rounded-full bg-[#f4f2ef] border-2 border-white shadow-sm"
                    unoptimized
                  />
                  {PROFILE.verified && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#7a1f32] border-2 border-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a227]" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161414] leading-tight">
                      {PROFILE.name}
                    </h1>

                    {PROFILE.verified && (
                      <span className="badge-gold gap-1 !text-[10px] !px-2.5 !py-1">
                        <CheckCircle2 className="w-3 h-3" />
                        CIT-U VERIFIED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#4a4340]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#161414]">
                      <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
                      {PROFILE.rating} Star Rating
                    </span>
                    <span className="text-[#d8d3cc]">•</span>
                    <span>{PROFILE.course}</span>
                  </div>
                </div>
              </div>

              {/* Right: Edit button */}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl bg-[#7a1f32] hover:bg-[#5f1727]
                  text-white text-sm font-semibold
                  px-5 py-2.5 transition-all duration-300
                  shadow-[0_8px_18px_rgba(122,31,50,0.22)]
                  hover:-translate-y-0.5 shrink-0 self-start sm:self-center
                "
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </section>
        </ScrollReveal>

        {/* ───── Stats Row ───── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            {
              label: "Quests Completed",
              value: PROFILE.stats.completed,
              valueClass: "text-[#7a1f32]",
            },
            {
              label: "Quests Posted",
              value: PROFILE.stats.posted,
              valueClass: "text-[#161414]",
            },
            {
              label: "Total Earnings",
              value: `₱${PROFILE.stats.earnings}`,
              valueClass: "text-[#c9a227]",
            },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} delayMs={i * 80} variant="scale">
              <article
                className="
                  group shine-wrap card-interactive card-surface p-5
                  hover:shadow-[0_14px_36px_rgba(122,31,50,0.12)]
                "
              >
                <div className="relative z-[1]">
                  <p className="text-xs font-medium text-[#4a4340] mb-2">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-extrabold leading-none ${stat.valueClass}`}>
                    {stat.value}
                  </p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* ───── Menu List ───── */}
        <ScrollReveal delayMs={120}>
          <section className="card-surface overflow-hidden">
            <ul className="divide-y divide-[#e5e0d8]">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="
                        group flex items-center gap-4 px-5 py-4
                        transition-all duration-300
                        hover:bg-[#fbf8f0]
                      "
                    >
                      <div
                        className={`
                          w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                          transition-transform duration-300 group-hover:scale-105
                          ${item.iconBg}
                        `}
                      >
                        <Icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-bold text-[#161414] group-hover:text-[#7a1f32] transition-colors duration-300">
                          {item.title}
                        </p>
                        <p className="text-xs sm:text-sm text-[#4a4340] truncate">
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

              {/* ───── Sign Out Row ───── */}
              <li>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="
                    w-full text-left group flex items-center gap-4 px-5 py-4
                    transition-all duration-300
                    hover:bg-[#fdecec]/50
                  "
                >
                  <div className="w-11 h-11 rounded-xl bg-[#fdecec] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
                    <LogOut className="w-5 h-5 text-[#b42318]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold text-[#b42318] transition-colors duration-300">
                      Sign Out
                    </p>
                    <p className="text-xs sm:text-sm text-[#4a4340] truncate">
                      Log out of your QuestGo account
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#d8d3cc] shrink-0 transition-all duration-300 group-hover:text-[#b42318] group-hover:translate-x-0.5" />
                </button>
              </li>
            </ul>
          </section>
        </ScrollReveal>

        {/* ───── Simple Edit Modal (UI only) ───── */}
        {editOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setEditOpen(false)}
          >
            <div
              className="card-surface w-full max-w-md p-6 animate-fade-up"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-profile-title"
            >
              <h2
                id="edit-profile-title"
                className="text-xl font-extrabold text-[#161414] mb-1"
              >
                Edit Profile
              </h2>
              <p className="text-sm text-[#4a4340] mb-5">
                Update your public QuestGo identity details.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-[#161414] mb-1.5">
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
                  <label className="block text-sm font-semibold text-[#161414] mb-1.5">
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
                    transition-all duration-300
                  "
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="btn-primary !py-2.5 !px-5 !text-sm"
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