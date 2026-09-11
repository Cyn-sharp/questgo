"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CheckCircle2 } from "lucide-react";

// --- MARKETING NAVBAR (Unauthenticated / Public Landing Page) ---
const marketingNavItems = [
  {
    label: "Home",
    href: "#home",
    className: "font-semibold text-[15px] text-[#c9a227] hover:text-[#e6b93d] transition",
  },
  {
    label: "How It Works",
    href: "#how-it-works",
    className: "font-medium text-[15px] text-white/90 hover:text-[#c9a227] transition",
  },
  {
    label: "Safety",
    href: "#safety",
    className: "font-medium text-[15px] text-white/90 hover:text-[#c9a227] transition",
  },
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
    <header className="relative z-50 flex min-h-[72px] w-full flex-col items-start bg-[#161414] border-b border-[#2a2a2a]">
      <div className="flex min-h-[72px] w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-16 md:py-4">
        <Link href="/" aria-label="QuestGo CIT-U Campus home" className="inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="QuestGo logo"
            width={40}
            height={40}
            className="rounded-[10px] object-contain"
            priority
          />
          <span className="inline-flex min-w-0 flex-col items-start gap-0.5">
            <span className="font-bold text-lg leading-none tracking-tight text-white sm:text-xl">
              QuestGo
            </span>
            <span className="hidden font-medium text-[11px] uppercase leading-none tracking-[0.12em] text-white/70 sm:inline">
              CIT-U Campus
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="inline-flex items-center gap-8">
            {marketingNavItems.map((item) => (
              <li key={item.label}>
                <a href={item.href} className={item.className}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

  <div className="inline-flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden items-center justify-center rounded-xl border-[1.5px] border-[#7a1f32] px-3 py-2 font-semibold text-xs text-white transition hover:bg-white/5 sm:inline-flex sm:px-5 sm:py-2.5 sm:text-[14px]"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="hidden items-center justify-center rounded-xl bg-[#7a1f32] px-3 py-2 font-semibold text-xs text-white shadow-[0px_8px_18px_#7a1f3226] transition hover:bg-[#661a2a] sm:inline-flex sm:px-5 sm:py-2.5 sm:text-[14px]"
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
            onWheel={() => setIsMenuOpen(false)}
            onTouchMove={() => setIsMenuOpen(false)}
          >
            <ul className="flex flex-col gap-1">
              {marketingNavItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex min-h-11 items-center rounded-lg px-3 font-inter text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-[#c9a227]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="mt-1 border-t border-white/10 pt-1 sm:hidden">
                <a href="/login" onClick={() => setIsMenuOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 font-inter text-sm font-semibold text-white/90 hover:bg-white/10">Log In</a>
              </li>
              <li className="sm:hidden">
                <a href="/register" onClick={() => setIsMenuOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 font-inter text-sm font-semibold text-white/90 hover:bg-white/10">Register</a>
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
  { label: "My Requests", href: "/requests" },
  { label: "Profile", href: "/profile" },
];

export const Navbar = (): ReactElement => {
  const pathname = usePathname();

  return (
    <header className="flex flex-col items-start bg-[#161414] border-b border-[#2a2a2a]">
      <div className="flex items-center justify-between px-6 md:px-16 py-4 w-full max-w-screen-2xl mx-auto">
        <Link href="/dashboard" aria-label="QuestGo CIT-U Campus home" className="inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="QuestGo logo"
            width={40}
            height={40}
            className="rounded-[10px] object-contain"
            priority
          />
          <span className="inline-flex flex-col items-start gap-0.5">
            <span className="font-bold text-white text-xl tracking-tight leading-none">QuestGo</span>
            <span className="font-medium text-white/70 text-[11px] tracking-[0.12em] uppercase leading-none">
              CIT-U Campus
            </span>
          </span>
        </Link>

        {/* Dynamic Navigation Links */}
        <nav aria-label="Primary navigation" className="hidden lg:block">
          <ul className="inline-flex items-center gap-8">
            {dashboardNavItems.map((item) => {
              // Determines active link based on current URL path
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`text-[14px] font-medium transition-all pb-1 border-b-2 ${
                      isActive
                        ? "text-[#c9a227] border-[#c9a227]"
                        : "text-white/90 border-transparent hover:text-[#c9a227]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Badge, Notifications & Profile */}
        <div className="hidden md:inline-flex items-center gap-6">
          <div className="flex items-center gap-1.5 border border-[#3A3326] bg-[#221D15] px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a227]" />
            <span className="text-[#c9a227] text-[10px] font-bold tracking-widest uppercase">
              CIT-U Verified
            </span>
          </div>

          <button className="relative text-gray-400 hover:text-white transition">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#161414]"></span>
          </button>

          <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition">
            <Image
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dave"
              alt="User avatar"
              width={36}
              height={36}
              className="rounded-full bg-white shrink-0"
              unoptimized
            />
            <span className="text-white text-[14px] font-medium whitespace-nowrap">
              Dave Alinson
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;