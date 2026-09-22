"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useMouseParallax } from "@/hooks/useMouseParallax";

const safetyChecks = [
  {
    title: "Official @cit.edu email verification",
    description: "Only students with a valid CIT-U email can register, keeping QuestGo limited to verified students.",
  },
  {
    title: "One verified account per student profile",
    description: "Each user is connected to one verified account, reducing duplicate or misleading profiles.",
  },
  {
    title: "One dedicated Quest Runner per task",
    description: "Once a Quest is accepted, it leaves the available list so only one Quest Runner handles it.",
  },
  {
    title: "Automatic 30-minute Quest expiration",
    description: "Unaccepted Quests expire after 30 minutes, keeping requests current and preventing stale tasks.",
  },
  {
    title: "Secure chat messenger after acceptance",
    description: "Requesters and Quest Runners can coordinate details and meet-ups through Messenger after acceptance.",
  },
  {
    title: "Instant report and blocking tools",
    description: "Users can report or block problematic accounts or Quests, with administrators available to review reports.",
  },
  {
    title: "Transparent ratings and reputation status",
    description: "Ratings, feedback, profiles, and Quest history help students understand activity and build trust.",
  },
  {
    title: "No-risk cash on delivery payment flow",
    description: "The agreed reward is given when the Quest is completed according to the agreed meet-up arrangement.",
  },
];

export const SafetyChecklist = () => {
  const { ref, x, y, onMouseMove, onMouseLeave } = useMouseParallax<HTMLElement>(1.5);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? selectedIndex;

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      id="safety"
      aria-labelledby="safety-checklist-title"
      className="relative flex flex-col items-start gap-8 border-b border-white/10 bg-transparent px-4 sm:px-6 md:px-16 py-12 md:py-20"
    >
      {/* Header reveal — static text */}
      <ScrollReveal className="w-full">
        <header className="relative flex w-full flex-col items-center gap-2 text-center">
          <h2 id="safety-checklist-title" className="font-bold text-2xl sm:text-3xl tracking-tight text-white md:text-[32px]">
            Campus Safety First
          </h2>
          <p className="font-normal text-sm sm:text-base text-[#f6ecc8]/85">Multiple layers of verification and transparency</p>
        </header>
      </ScrollReveal>

      {/* Checklist grid — mobile-optimized tap interaction */}
      <ul
        aria-label="Campus safety protections"
        className="grid w-full grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 list-none m-0 p-0"
        style={{
          transform: `translate3d(${x * 2}px, ${y * 2}px, 0)`,
          transition: "transform 0.25s ease-out",
        }}
      >
        {safetyChecks.map((safetyCheck, index) => {
          const isActive = activeIndex === index;
          const isDimmed = activeIndex !== null && !isActive;

          return (
            <ScrollReveal
              key={safetyCheck.title}
              delayMs={index * 50}
              variant="fade-up"
              className="w-full"
            >
              <motion.li
                animate={{
                  y: isActive ? -4 : 0,
                  scale: isActive ? 1.025 : 1,
                  rotate: isActive ? (index % 2 === 0 ? 0.8 : -0.8) : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                style={{ transformOrigin: "center center", zIndex: isActive ? 20 : 1 }}
                className={`relative min-h-[68px] transition-[filter,opacity] duration-300 ${isDimmed ? "opacity-50 blur-[0.5px]" : ""}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  className={`group relative flex min-h-[68px] w-full items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left transition-[box-shadow,border-color,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] ${
                    isActive
                      ? "border-[#c9a227] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.3)]"
                      : "border-white/15 bg-white/95 backdrop-blur-md hover:border-[#c9a227] hover:bg-white hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
                  }`}
                  onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                  aria-expanded={isActive}
                  aria-pressed={selectedIndex === index}
                >
                  <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#e8d9a8] bg-[#fdf9eb]">
                    <span className="text-[10px] font-bold text-[#8a6a1f]">&#10003;</span>
                  </span>
                  <span className={`font-medium text-sm sm:text-[15px] leading-snug transition-opacity duration-200 ${isActive ? "opacity-0" : "text-[#161414]"}`}>
                    {safetyCheck.title}
                  </span>

                  <motion.span
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`pointer-events-none absolute inset-0 flex items-center gap-3 bg-[#5f1727] px-4 py-3 text-white ${isActive ? "" : "invisible"}`}
                  >
                    <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c9a227] text-[10px] font-bold text-[#161414]">&#10003;</span>
                    <span className="font-inter text-xs sm:text-[13px] leading-relaxed text-white/95">{safetyCheck.description}</span>
                  </motion.span>
                </motion.button>
              </motion.li>
            </ScrollReveal>
          );
        })}
      </ul>
    </section>
  );
};