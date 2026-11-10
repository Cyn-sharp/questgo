"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/auth/firebase";
import { getProfileName } from "@/lib/auth/profile-name";
import { BrandMark } from "@/components/ui/BrandMark";
import { Avatar } from "@/components/ui/Avatar";
import { NavLink } from "@/components/navigation/NavLink";

// --- MARKETING NAVBAR (Unauthenticated / Public Landing Page) ---
// Anchors use /#path so they work from every subroute.
const marketingNavItems = [
  { label: "Home", href: "/#home" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Safety", href: "/#safety" },
];

export const HeaderContainer = (): ReactElement => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnScroll = () => setIsMenuOpen(false);
    const closeOnDesktopResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("scroll", closeOnScroll, { passive: true, capture: true });
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktopResize);

    return () => {
      document.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktopResize);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 flex w-full flex-col items-start border-b border-white/[0.08] bg-[#161414]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/#home" aria-label="QuestGo CIT-U Campus home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          <BrandMark />
        </Link>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {marketingNavItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="inline-flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden h-10 items-center justify-center rounded-xl border border-white/20 px-4 text-[14px] font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:inline-flex"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="hidden h-10 items-center justify-center rounded-xl bg-gold px-4 text-[14px] font-semibold text-dark shadow-[0_4px_18px_rgba(201,162,39,0.25)] transition hover:bg-[#b08b1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark sm:inline-flex"
          >
            Register
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-primary-navigation"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <svg className={`h-5 w-5 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isMenuOpen ? (
          <motion.nav
            id="mobile-primary-navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            className="w-full overflow-hidden border-t border-white/10 bg-[#161414] px-4 pb-4 pt-2 sm:px-6 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {marketingNavItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="mt-1 border-t border-white/10 pt-1 sm:hidden">
                <Link 
                  href="/login" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="flex min-h-11 items-center rounded-lg px-3 font-inter text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  Log In
                </Link>
              </li>
              <li className="sm:hidden">
                <Link 
                  href="/register" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="flex min-h-11 items-center rounded-lg px-3 font-inter text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  Register
                </Link>
              </li>
            </ul>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
};


// --- DASHBOARD NAVBAR (Logged-In User App Shell) ---
const dashboardNavItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Find a Quest", href: "/quests" },
  { label: "Post a Quest", href: "/post-quest" },
  { label: "My Quests", href: "/requests" },
  { label: "Profile", href: "/profile" },
];

export const Navbar = (): ReactElement => {
  const pathname = usePathname();
  const { user: firebaseUser } = useAuth();
  const [savedProfile, setSavedProfile] = useState<{
    uid: string; fullName?: string; profilePhotoUrl?: string;
  } | null>(null);
  const currentProfile = savedProfile?.uid === firebaseUser?.uid ? savedProfile : null;
  const headerName = getProfileName(firebaseUser?.displayName, currentProfile?.fullName);
  const firstName = headerName.split(/\s+/)[0];
  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  useEffect(() => {
    if (!firebaseUser) {
      return;
    }

    const userRef = doc(db, "users", firebaseUser.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data();
        setSavedProfile({ uid: firebaseUser.uid, fullName: data?.fullName, profilePhotoUrl: data?.profilePhotoUrl });
      },
      (error) => {
        console.error("Header profile snapshot failed:", error);
        setSavedProfile(null);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  return (
    // Shown at every width: phones get the brand and avatar (links live in the bottom bar),
    // tablets and up get the full link row.
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#161414]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/dashboard" aria-label="QuestGo home" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          <BrandMark />
        </Link>

        <nav aria-label="Primary navigation" className="hidden flex-1 justify-center md:flex">
          <ul className="flex items-center gap-0.5 lg:gap-1">
            {dashboardNavItems.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} active={isActive(item.href)}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <span className="hidden items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gold xl:inline-flex">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            CIT-U Verified
          </span>
          <Link
            href="/profile"
            aria-label={`Your profile, ${headerName}`}
            className="flex items-center gap-2.5 rounded-full p-1 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:pr-3.5"
          >
            <Avatar name={headerName} src={currentProfile?.profilePhotoUrl || firebaseUser?.photoURL} size={30} />
            <span className="hidden max-w-[9rem] truncate text-[14px] font-medium text-white lg:block">{firstName}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
