"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

type PromoContent = {
  heading: string;
  accentWord: string;
  copy: string;
  badgeCaption: string;
  backgroundColor: string;
  accentColor: string;
  order: "order-first" | "order-first lg:order-last";
};

const PANEL_CONTENT: Record<string, PromoContent> = {
  "/login": {
    heading: "Welcome Back to",
    accentWord: "QuestGo.",
    copy: "Your next Quest is waiting. Hop on to resolve pending tasks, deliver favors, or post something you need completed today.",
    badgeCaption: "Safer peer-to-peer campus platform",
    backgroundColor: "#4e0f1e",
    accentColor: "#c9a227",
    order: "order-first lg:order-last",
  },
  "/register": {
    heading: "Empower Your",
    accentWord: "Wildcat Life.",
    copy: "Join fellow students who are already delegating, executing, and supporting one another on-campus.",
    badgeCaption: "Official student-only verification",
    backgroundColor: "#4e0f1e",
    accentColor: "#c9a227",
    order: "order-first",
  },
};

export function AuthPromoPanel() {
  const pathname = usePathname();
  const content = PANEL_CONTENT[pathname] ?? PANEL_CONTENT["/login"];

  return (
    <motion.aside
      layout
      animate={{ backgroundColor: content.backgroundColor }}
      transition={{
        layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
        backgroundColor: { duration: 0.6, ease: "easeInOut" },
      }}
      style={{
        backgroundImage:
          "linear-gradient(110deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0) 44%), radial-gradient(circle at 20% 10%, rgba(201, 162, 39, 0.12) 0%, transparent 40%)",
      }}
      className={`relative flex w-full min-w-0 flex-col justify-between gap-6 p-6 sm:gap-10 sm:p-8 lg:w-1/2 lg:p-16 ${content.order}`}
      aria-label="QuestGo community highlights"
    >
      <header className="inline-flex items-center gap-3 sm:gap-4">
        <div
          className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-[#7a1f32] sm:h-[60px] sm:w-[60px]"
          role="img"
          aria-label="QuestGo logo"
        >
          <Image src="/logo.png" alt="" fill sizes="60px" className="object-contain" />
        </div>
        <div className="inline-flex min-w-0 flex-col gap-0.5">
          <span className="font-outfit text-xl font-extrabold text-white sm:text-2xl">QuestGo</span>
          <span
            className="font-inter text-[11px] font-semibold tracking-[0.18px] sm:text-xs"
            style={{ color: content.accentColor }}
          >
            CIT-U WILDCAT GIGS
          </span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="flex max-w-2xl flex-col gap-3 sm:gap-4"
        >
          <h2 className="font-outfit text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
            <span className="text-white">{content.heading} </span>
            <span style={{ color: content.accentColor }}>{content.accentWord}</span>
          </h2>
          <p className="font-inter text-sm leading-relaxed text-[#fbf8f0]/95 sm:text-base lg:text-lg">
            {content.copy}
          </p>
        </motion.section>
      </AnimatePresence>

      <footer className="inline-flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#f6ecc8] bg-[#fdf9eb] px-2.5 py-1 font-inter text-[11px] font-semibold tracking-[0.06px] text-[#7a1f32]">
          <span aria-hidden="true">&#10003;</span> CIT-U VERIFIED
        </span>
        <AnimatePresence mode="wait">
          <motion.p
            key={`${pathname}-caption`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="font-inter text-[12px] text-[#f6ecc8] sm:text-[13px]"
          >
            {content.badgeCaption}
          </motion.p>
        </AnimatePresence>
      </footer>
    </motion.aside>
  );
}