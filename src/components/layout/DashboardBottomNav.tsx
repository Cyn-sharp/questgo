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
    <nav
      aria-label="Dashboard bottom navigation"
      className="
        fixed bottom-0 left-0 right-0 z-50 md:hidden
        flex justify-center
        pb-[env(safe-area-inset-bottom)]
        pointer-events-none
      "
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.15,
        }}
        className="
          pointer-events-auto
          relative
          mx-4 mb-4
          w-[calc(100%-2rem)] max-w-[420px]
          rounded-[28px]
          bg-white/90
          backdrop-blur-2xl
          border border-white/60
          shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]
        "
      >
        {/* Subtle top specular line — NOT clipped because no overflow-hidden */}
        <div className="absolute top-0 left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-full pointer-events-none" />

        <ul className="flex items-stretch justify-around px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);

            /* ── Center Tab: Floating Action Button ── */
            if (tab.isCenter) {
              return (
                <li
                  key={tab.href}
                  className="flex-1 flex justify-center relative"
                >
                  <Link
                    href={tab.href}
                    aria-label={tab.label}
                    aria-current={active ? "page" : undefined}
                    className="absolute -top-8 flex flex-col items-center group"
                  >
                    {/* Soft ambient gold glow */}
                    <div
                      className="
                        absolute -inset-3
                        bg-[#c9a227]/20 rounded-full
                        blur-xl pointer-events-none
                        transition-opacity duration-300
                        opacity-60 group-hover:opacity-100
                      "
                    />

                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.08 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 18,
                      }}
                      className="
                        relative flex h-14 w-14 items-center justify-center
                        rounded-full
                        bg-gradient-to-br from-[#e0c353] via-[#c9a227] to-[#9a7d14]
                        shadow-[0_6px_24px_rgba(201,162,39,0.5),0_2px_8px_rgba(201,162,39,0.3)]
                        border-[3px] border-white
                        transition-shadow duration-300
                        group-hover:shadow-[0_10px_36px_rgba(201,162,39,0.6),0_2px_10px_rgba(201,162,39,0.4)]
                      "
                    >
                      {/* Inner specular highlight */}
                      <div
                        className="
                          absolute inset-[3px] rounded-full
                          bg-gradient-to-br from-white/35 via-white/5 to-transparent
                          pointer-events-none
                        "
                      />
                      <Icon
                        className="h-6 w-6 text-white relative z-10"
                        strokeWidth={2.5}
                      />
                    </motion.div>

                    <span
                      className={`
                        mt-2 text-[9px] font-extrabold tracking-[0.08em] uppercase leading-none
                        transition-colors duration-300
                        ${
                          active
                            ? "text-[#c9a227]"
                            : "text-[#4a4340]/70 group-hover:text-[#7a1f32]"
                        }
                      `}
                    >
                      {tab.label}
                    </span>
                  </Link>
                </li>
              );
            }

            /* ── Regular Tabs ── */
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className="
                    relative flex flex-col items-center justify-center
                    gap-1.5 py-2.5 min-h-[52px] rounded-2xl group
                  "
                >
                  {/* Animated pill highlight */}
                  <motion.span
                    className="absolute inset-x-1 top-1 bottom-1 rounded-2xl"
                    animate={{
                      backgroundColor: active
                        ? "rgba(122,31,50,0.08)"
                        : "rgba(0,0,0,0)",
                      scale: active ? 1 : 0.92,
                      opacity: active ? 1 : 0,
                    }}
                    whileHover={{
                      backgroundColor: "rgba(122,31,50,0.05)",
                      scale: 0.95,
                      opacity: 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 28,
                    }}
                  />

                  {/* Top active indicator bar */}
                  {active && (
                    <motion.span
                      layoutId="floating-nav-indicator"
                      className="absolute top-0 h-[3px] w-6 rounded-full bg-[#c9a227]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  <motion.div
                    whileTap={{ scale: 0.8 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 18,
                    }}
                    className={`
                      relative flex items-center justify-center rounded-xl
                      transition-all duration-300
                      ${
                        active
                          ? "text-[#7a1f32] drop-shadow-[0_1px_4px_rgba(122,31,50,0.15)]"
                          : "text-[#4a4340]/55 group-hover:text-[#7a1f32]"
                      }
                    `}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={active ? 2.4 : 1.8}
                    />
                  </motion.div>

                  <span
                    className={`
                      text-[9px] font-bold tracking-[0.05em] uppercase leading-none
                      transition-all duration-300
                      ${
                        active
                          ? "text-[#7a1f32]"
                          : "text-[#4a4340]/50 group-hover:text-[#7a1f32]"
                      }
                    `}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </nav>
  );
}

export default DashboardBottomNav;