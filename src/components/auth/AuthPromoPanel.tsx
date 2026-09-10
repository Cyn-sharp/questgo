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
    accentColor: "#8a6a1f",
    order: "order-first lg:order-last",
  },
  "/register": {
    heading: "Empower Your",
    accentWord: "Wildcat Life.",
    copy: "Join fellow students who are already delegating, executing, and supporting one another on-campus.",
    badgeCaption: "Official student-only verification",
    backgroundColor: "#4e0f1e",
    accentColor: "#8a6a1f",
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
        backgroundImage: "linear-gradient(110deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0) 44%)",
      }}
      className={`relative flex w-full min-w-0 flex-col justify-between gap-8 p-6 sm:gap-12 sm:p-8 lg:w-1/2 lg:p-16 ${content.order}`}
      aria-label="QuestGo community highlights"
    >
      <header className="inline-flex items-center gap-4">
        <div className="relative h-[60px] w-[60px] overflow-hidden rounded-xl bg-[#7a1f32]" role="img" aria-label="QuestGo logo">
          <Image src="/logo.png" alt="" fill sizes="60px" className="object-contain" />
        </div>
        <div className="inline-flex flex-col gap-0.5">
          <span className="font-outfit text-2xl font-extrabold text-white">QuestGo</span>
          <span className="font-inter text-xs font-semibold tracking-[0.18px]" style={{ color: content.accentColor }}>
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
          className="flex max-w-2xl flex-col gap-4"
        >
          <h2 className="font-outfit text-3xl font-extrabold leading-tight sm:text-4xl">
            <span className="text-white">{content.heading} </span>
            <span style={{ color: content.accentColor }}>{content.accentWord}</span>
          </h2>
          <p className="font-inter text-base leading-relaxed text-[#fbf8f0] sm:text-lg">{content.copy}</p>
        </motion.section>
      </AnimatePresence>

      <footer className="inline-flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#f6ecc8] bg-[#fdf9eb] px-2 py-1 font-inter text-[11px] font-semibold tracking-[0.06px] text-[#7a1f32]">
          <span aria-hidden="true">&#10003;</span> CIT-U VERIFIED
        </span>
        <AnimatePresence mode="wait">
          <motion.p
            key={`${pathname}-caption`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="font-inter text-[13px] text-[#f6ecc8]"
          >
            {content.badgeCaption}
          </motion.p>
        </AnimatePresence>
      </footer>
    </motion.aside>
  );
}
