"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, PlusCircle, ClipboardList, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TabItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  isCenter?: boolean;
};

const tabs: TabItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Find", href: "/quests", icon: Search },
  { label: "Post", href: "/post-quest", icon: PlusCircle, isCenter: true },
  { label: "Requests", href: "/requests", icon: ClipboardList },
  { label: "Profile", href: "/profile", icon: User },
];

export function DashboardBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Fixed bottom nav — mobile only. Hidden on md+ where the top Navbar shows. */}
      <nav
        aria-label="Dashboard bottom navigation"
        className="
          fixed bottom-0 left-0 right-0 z-50 md:hidden
          bg-[#161414]/95 backdrop-blur-xl
          border-t border-white/10
          shadow-[0_-8px_24px_rgba(0,0,0,0.35)]
          pb-[env(safe-area-inset-bottom)]
        "
      >
        <ul className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);

            // Center tab (Post a Quest) — elevated floating button style
            if (tab.isCenter) {
              return (
                <li key={tab.href} className="flex-1 flex justify-center">
                  <Link
                    href={tab.href}
                    aria-label={tab.label}
                    aria-current={active ? "page" : undefined}
                    className="relative -mt-6 flex flex-col items-center"
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={`
                        flex h-14 w-14 items-center justify-center rounded-full
                        bg-gradient-to-br from-[#c9a227] to-[#b08b1e]
                        shadow-[0_8px_20px_rgba(201,162,39,0.5)]
                        border-4 border-[#161414]
                        transition-all
                        ${active ? "ring-2 ring-[#c9a227]/40 ring-offset-2 ring-offset-[#161414]" : ""}
                      `}
                    >
                      <Icon
                        className="h-6 w-6 text-[#161414]"
                        strokeWidth={2.5}
                      />
                    </motion.div>
                    <span
                      className={`
                        mt-1 text-[10px] font-bold tracking-wide uppercase
                        ${active ? "text-[#c9a227]" : "text-white/70"}
                      `}
                    >
                      {tab.label}
                    </span>
                  </Link>
                </li>
              );
            }

            // Regular tabs
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className="relative flex flex-col items-center justify-center gap-1 py-2 min-h-[56px]"
                >
                  {/* Active indicator dot */}
                  {active && (
                    <motion.span
                      layoutId="active-tab-indicator"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-[#c9a227]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={`
                      flex items-center justify-center rounded-lg
                      transition-colors duration-300
                      ${active ? "text-[#c9a227]" : "text-white/60"}
                    `}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </motion.div>

                  <span
                    className={`
                      text-[10px] font-semibold tracking-wide leading-none
                      transition-colors duration-300
                      ${active ? "text-[#c9a227]" : "text-white/60"}
                    `}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export default DashboardBottomNav;