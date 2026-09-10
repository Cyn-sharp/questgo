"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? selectedIndex;

  return (
    <section
      id="safety"
      aria-labelledby="safety-checklist-title"
      className="relative flex flex-col items-start gap-8 border-b border-[#e5e0d9] bg-white px-6 py-16 md:px-16"
    >
      <header className="relative flex w-full flex-col items-center gap-2 text-center">
        <h2 id="safety-checklist-title" className="font-bold text-3xl tracking-tight text-[#161414] md:text-[32px]">
          Campus Safety First
        </h2>
        <p className="font-normal text-base text-[#4a4340]">Multiple layers of verification and transparency</p>
      </header>

      <ul aria-label="Campus safety protections" className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {safetyChecks.map((safetyCheck, index) => {
          const isActive = activeIndex === index;
          const isDimmed = activeIndex !== null && !isActive;

          return (
            <motion.li
              key={safetyCheck.title}
              animate={{
                y: isActive ? -8 : 0,
                scale: isActive ? 1.045 : 1,
                rotate: isActive ? (index % 2 === 0 ? 1.4 : -1.4) : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
                mass: 0.8,
              }}
              style={{ transformOrigin: "center center", zIndex: isActive ? 20 : 1 }}
              className={`relative min-h-[78px] transition-[filter,opacity] duration-500 ${isDimmed ? "opacity-45 blur-[1px]" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                className={`group relative flex min-h-[78px] w-full items-center gap-3 overflow-hidden rounded-xl border bg-[#fdfcf8] px-4 py-3.5 text-left transition-[box-shadow,border-color,background-color] duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a1f32] ${isActive ? "border-[#7a1f32] bg-white shadow-[0_20px_38px_#7a1f3233]" : "border-[#e5e0d9] hover:border-[#8a6a1f] hover:bg-[#fbf8f0] hover:shadow-[0_10px_22px_#00000012]"}`}
                onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                aria-expanded={isActive}
                aria-pressed={selectedIndex === index}
              >
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e8d9a8] bg-[#fdf9eb]">
                  <span className="text-xs font-bold text-[#8a6a1f]">&#10003;</span>
                </span>
                <span className={`font-medium text-[15px] leading-snug transition-opacity duration-200 ${isActive ? "opacity-0" : "text-[#161414]"}`}>
                  {safetyCheck.title}
                </span>

                <motion.span
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className={`pointer-events-none absolute inset-0 flex items-center gap-3 bg-white/90 px-4 py-3 text-[#4a4340] backdrop-blur-sm ${isActive ? "" : "invisible"}`}
                >
                  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7a1f32] text-xs font-bold text-white">&#10003;</span>
                  <span className="font-inter text-[13px] leading-relaxed">{safetyCheck.description}</span>
                </motion.span>
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
};
