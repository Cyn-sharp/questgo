"use client";

import { useEffect, useRef, useState } from "react";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
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
import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/auth/firebase";
import { endSession } from "@/lib/auth/logout";
import { getProfileName } from "@/lib/auth/profile-name";
import { COURSES } from "@/lib/auth/courses";
import { updateMyProfile } from "@/lib/quests/client";
import {
  getProfileQuestStats,
} from "@/lib/db/quests";
import type { User as UserProfile } from "@/types/user";
import { ProfileSkeleton } from "@/components/skeletons/PageSkeletons";
import { VerifiedRunnerBadge } from "@/components/runner/VerifiedRunnerBadge";
import { useRunnerStatus } from "@/hooks/useRunnerStatus";

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


const MENU_ITEMS = [
  {
    id: "verification",
    title: "Verification",
    description: "Verified via your CIT-U email",
    href: "/profile/verification",
    icon: ShieldCheck,
    iconBg: "bg-[#f6f0e8]",
    iconColor: "text-maroon",
  },
  {
    id: "history",
    title: "Message Archive",
    description: "Read past completed and cancelled conversations",
    href: "/profile/archive",
    icon: History,
    iconBg: "bg-[#fbf0d6]",
    iconColor: "text-gold-ink",
  },
  {
    id: "wallet",
    title: "Quest Wallet",
    description: "Manage your completed earnings and options",
    href: "/profile/wallet",
    icon: Wallet,
    iconBg: "bg-[#fdecec]",
    iconColor: "text-maroon",
  },
  {
    id: "safety",
    title: "Safety Center",
    description: "Rules, public meetups and code of conduct",
    href: "/safety",
    icon: LifeBuoy,
    iconBg: "bg-[#f6f0e8]",
    iconColor: "text-maroon",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure chat and alert systems",
    href: "/notifications",
    icon: Bell,
    iconBg: "bg-[#f4f2ef]",
    iconColor: "text-muted",
  },
  {
    id: "settings",
    title: "Settings",
    description: "Adjust password and profile settings",
    href: "/profile/settings",
    icon: Settings,
    iconBg: "bg-[#f4f2ef]",
    iconColor: "text-muted",
  },
] as const;

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { status: runnerStatus } = useRunnerStatus();
  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ completed: 0, posted: 0, earnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [editName, setEditName] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const authenticatedUser = user;
    let active = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setLoadError("");

        const [profileSnapshot, questStats] = await Promise.all([
          getDoc(doc(db, "users", authenticatedUser.uid)),
          getProfileQuestStats(authenticatedUser.uid),
        ]);

        if (!active) return;

        const savedProfile = profileSnapshot.exists()
          ? (profileSnapshot.data() as Partial<UserProfile>)
          : {};

        setProfile({
          id: authenticatedUser.uid,
          email: savedProfile.email ?? authenticatedUser.email ?? "",
          fullName: getProfileName(authenticatedUser.displayName, savedProfile.fullName),
          isVerified: authenticatedUser.emailVerified,
          profilePhotoUrl: savedProfile.profilePhotoUrl ?? authenticatedUser.photoURL,
          course: savedProfile.course,
          averageRating: savedProfile.averageRating,
          ratingCount: savedProfile.ratingCount,
        });
        setStats(questStats);
      } catch (error) {
        console.error("Profile data loading failed:", error);
        if (active) setLoadError("Could not load your profile data. Please try again.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [isAuthLoading, router, user]);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError("");
    try {
      await endSession(() => auth.signOut());
      // A full navigation also discards cached authenticated route content.
      window.location.replace("/");
    } catch {
      setSignOutError("Could not finish signing out. Please try again.");
      setIsSigningOut(false);
    }
  }

  async function handleSaveProfile() {
    if (!user || !profile || isSaving) return;
    const fullName = editName.trim();
    if (!fullName) {
      setSaveError("Please enter your name.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      // One server call updates both the Auth name and the Firestore profile.
      const saved = await updateMyProfile(fullName, editCourse);
      await user.reload();
      setProfile((current) => current ? { ...current, fullName: saved.fullName, course: saved.course } : current);
      setEditOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const showSkeleton = useMinimumLoading(isAuthLoading || isLoading) && !loadError;
  if (showSkeleton) {
    return <ProfileSkeleton />;
  }

  if (!user || !profile) {
    return (
      <div className="page-container py-12 text-center text-white">
        {loadError || "Profile data is unavailable."}
      </div>
    );
  }

  const profileName = profile.fullName;
  const profileCourse = profile.course || "CIT-U Student";
  const profileRating = profile.averageRating?.toFixed(1) ?? "No ratings";
  const profileAvatar =
    profile.profilePhotoUrl ||
    user.photoURL ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileName)}&backgroundColor=7a1f32&textColor=f6ecc8`;

  return (
    <div className="bg-transparent min-h-full">
      <div className="page-container py-6 sm:py-10 lg:py-12">
        {/* ───── Profile Hero Card ───── */}
        <ScrollReveal>
          <section className="relative rounded-2xl bg-white border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.3)] mb-4 sm:mb-5">
            {/* Banner strip — rounded only on top so avatar can hang over cleanly */}
            <div className="relative h-16 sm:h-20 rounded-t-2xl overflow-hidden bg-gradient-to-br from-maroon via-maroon-dark to-maroon-deep">
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
                        src={profileAvatar}
                        alt={profileName}
                        width={96}
                        height={96}
                        className="rounded-full bg-white border-4 border-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] w-20 h-20 sm:w-24 sm:h-24"
                        unoptimized
                      />
                      {profile.isVerified && (
                        <span className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gold border-[3px] border-white flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Name + meta — sits fully in white area, never clipped */}
                    <div className="min-w-0 sm:pb-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl md:text-[28px] font-extrabold text-dark leading-tight">
                          {profileName}
                        </h1>

                        {/* An approved runner's badge replaces the plain "Verified" pill. */}
                        {runnerStatus === "approved" ? (
                          <VerifiedRunnerBadge />
                        ) : (
                          profile.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-parchment text-maroon px-2 py-0.5 text-xs sm:text-xs font-bold tracking-wide uppercase shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                        <span className="inline-flex items-center gap-1 font-bold text-dark">
                          <Star className="w-3.5 h-3.5 text-gold-star fill-gold-star" />
                          {profileRating}
                          <span className="text-muted font-normal ml-0.5">rating</span>
                        </span>
                        <span className="text-subtle">•</span>
                        <span className="text-muted">{profileCourse}</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(profileName);
                      setEditCourse(profile.course || "");
                      setSaveError("");
                      setEditOpen(true);
                    }}
                    className="
                      inline-flex items-center justify-center gap-2
                      rounded-xl bg-maroon hover:bg-maroon-dark
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
              value: stats.completed,
              icon: Trophy,
              accentClass: "from-maroon to-maroon-dark",
              valueClass: "text-maroon",
              iconBg: "bg-[#fdf0f2]",
            },
            {
              label: "Posted",
              value: stats.posted,
              icon: Send,
              accentClass: "from-dark to-muted",
              valueClass: "text-dark",
              iconBg: "bg-[#f4f2ef]",
            },
            {
              label: "Earnings",
              value: `₱${stats.earnings.toLocaleString()}`,
              icon: Coins,
              accentClass: "from-gold to-[#b08b1e]",
              valueClass: "text-gold-ink",
              iconBg: "bg-parchment",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal key={stat.label} delayMs={i * 80} variant="scale">
                <article
                  className="
                    group shine-wrap card-interactive relative overflow-hidden
                    rounded-2xl border border-white/40 bg-white
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
                    <p className="text-xs sm:text-xs font-medium text-muted mt-1 sm:mt-2 truncate">
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
          <section className="rounded-2xl bg-white border border-white/40 shadow-[0_12px_32px_rgba(0,0,0,0.15)] overflow-hidden">
            <ul className="divide-y divide-border">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="
                        group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4
                        transition-all duration-300
                        hover:bg-cream active:bg-[#f6f0e8]
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
                        <p className="text-sm sm:text-base font-bold text-dark group-hover:text-maroon transition-colors duration-300">
                          {item.title}
                        </p>
                        <p className="text-xs sm:text-sm text-muted truncate">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight
                        className="
                          w-5 h-5 text-subtle shrink-0
                          transition-all duration-300
                          group-hover:text-maroon group-hover:translate-x-0.5
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
                  disabled={isSigningOut}
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
                      {isSigningOut ? "Signing out..." : "Sign Out"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted truncate">
                      Log out of your QuestGo account
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-subtle shrink-0 transition-all duration-300 group-hover:text-[#b42318] group-hover:translate-x-0.5" />
                </button>
                {signOutError && (
                  <p role="alert" className="px-5 pb-4 text-sm text-red-700">
                    {signOutError}
                  </p>
                )}
              </li>
            </ul>
          </section>
        </ScrollReveal>

        <p className="mt-6 text-center text-xs text-white/60 font-medium">
          QuestGo v1.0 · CIT-U Campus
        </p>

        {/* ───── Edit Modal ───── */}
        {editOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-[3px]"
            onClick={() => { if (!isSaving) setEditOpen(false); }}
          >
            <div
              className="rounded-2xl bg-white border border-white/40 w-full max-w-md p-5 sm:p-6 animate-fade-up shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-profile-title"
            >
              <h2
                id="edit-profile-title"
                className="text-lg sm:text-xl font-extrabold text-dark mb-1"
              >
                Edit Profile
              </h2>
              <p className="text-xs sm:text-sm text-muted mb-5">
                Update your public QuestGo identity details.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="profile-name" className="block text-xs sm:text-sm font-semibold text-dark mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="profile-name" maxLength={100}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    disabled={isSaving}
                    className="
                      w-full rounded-xl border border-field bg-white
                      px-4 py-3 text-sm text-dark
                      outline-none transition-all duration-300
                      focus:border-gold focus:ring-2 focus:ring-gold/20
                    "
                  />
                </div>

                <div>
                  <label htmlFor="profile-course" className="block text-xs sm:text-sm font-semibold text-dark mb-1.5">
                    Course / Program
                  </label>
                  <div className="relative">
                    <select
                      id="profile-course"
                      value={editCourse}
                      onChange={(event) => setEditCourse(event.target.value)}
                      disabled={isSaving}
                      className="
                        w-full appearance-none rounded-xl border border-border bg-white
                        px-4 py-3 pr-10 text-sm text-dark cursor-pointer
                        outline-none transition-all duration-300
                        focus:border-gold focus:ring-2 focus:ring-gold/20
                      "
                    >
                      <option value="">Select your course / program</option>
                      {editCourse && !COURSES.includes(editCourse) && (
                        <option value={editCourse}>{editCourse}</option>
                      )}
                      {COURSES.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/55" />
                  </div>
                </div>
              </div>

              {saveError && <p role="alert" className="mb-4 text-sm text-red-700">{saveError}</p>}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={isSaving}
                  className="
                    px-4 py-2.5 rounded-xl border border-border bg-white
                    text-sm font-semibold text-muted
                    hover:border-maroon hover:text-maroon
                    active:scale-95 transition-all
                  "
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-maroon hover:bg-maroon-dark text-white text-sm font-bold shadow-[0_4px_12px_rgba(122,31,50,0.2)] active:scale-95 transition-all"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
