"use client";

import { useRef, useState } from "react";
import { QuestCard } from "./QuestCard";

/**
 * A small frosted-glass card that gently bobs in place, tilts toward
 * the cursor, can be picked up and nudged around, and springs back to
 * its resting spot (and resumes floating) on release.
 *
 * Each transform lives on its own layer so they never overwrite one
 * another:
 *   drag layer   → translate from pointer drag (JS, spring-back)
 *   tilt layer   → perspective + rotateX/rotateY from mouse position,
 *                  plus the card's resting rotate and a small parallax shift
 *   float layer  → the idle vertical bob (CSS `animation` only)
 *   glass panel  → visual styling + the card content
 */
type FloatingCardProps = {
  width: number;
  rotate: number;
  duration: number;
  delay: number;
  children: React.ReactNode;
  mouseX: number; // -1 (left) .. 1 (right), relative to the hero
  mouseY: number; // -1 (top) .. 1 (bottom)
  depth?: number; // 0..1, how strongly this card reacts to the mouse
};

const FloatingCard = ({
  width,
  rotate,
  duration,
  delay,
  children,
  mouseX,
  mouseY,
  depth = 1,
}: FloatingCardProps) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - start.current.x,
      y: e.clientY - start.current.y,
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    setOffset({ x: 0, y: 0 }); // spring back to the resting spot
  };

  const maxTiltDeg = 10;
  const maxShiftPx = 16;
  const tiltX = -(mouseY * maxTiltDeg * depth);
  const tiltY = mouseX * maxTiltDeg * depth;
  const shiftX = mouseX * maxShiftPx * depth;
  const shiftY = mouseY * maxShiftPx * depth;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`touch-none select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: dragging ? "none" : "transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        zIndex: dragging ? 50 : undefined,
        position: "relative",
      }}
    >
      {/* Tilt layer: leans toward the cursor, keeps the card's resting tilt */}
      <div
        style={{
          transform: `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${rotate}deg) translate(${shiftX}px, ${shiftY}px)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        {/* Float layer: idle bob, animation-only so it never clobbers the tilt */}
        <div
          style={{
            animation: dragging ? "none" : `float ${duration}s ease-in-out ${delay}s infinite`,
          }}
        >
          <div className="glass-shine rounded-lg px-4 py-3" style={{ width }}>
            {children}
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-shine {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(14px) saturate(180%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow:
            0 10px 26px -12px rgba(22, 20, 20, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        .glass-shine::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 55%;
          height: 100%;
          background: linear-gradient(
            105deg,
            transparent 20%,
            rgba(255, 255, 255, 0.95) 50%,
            transparent 80%
          );
          transform: translateX(-160%) skewX(-18deg);
          pointer-events: none;
        }
        .glass-shine:hover::after {
          animation: glass-sweep 1.3s ease forwards;
        }
        @keyframes glass-sweep {
          to {
            transform: translateX(260%) skewX(-18deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-shine {
            animation: none !important;
          }
          .glass-shine::after {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const flush = () => {
    setMouse({ ...target.current });
    rafId.current = null;
  };

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    target.current = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
    if (rafId.current == null) rafId.current = requestAnimationFrame(flush);
  };

  const onMouseLeave = () => {
    target.current = { x: 0, y: 0 };
    if (rafId.current == null) rafId.current = requestAnimationFrame(flush);
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative w-full bg-transparent px-6 md:px-16 py-16 md:py-24 overflow-hidden"
    >
      {/* Floating particles */}
      <div className="particles hidden md:block" aria-hidden="true">
        <span className="particle" />
        <span className="particle" />
        <span className="particle" />
        <span className="particle" />
        <span className="particle" />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center relative z-10">
        {/* Text column — static, no parallax */}
        <div className="flex flex-col items-start gap-6 max-w-xl">
          <div className="animate-fade-up inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-1.5 rounded-full">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c9a227"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span className="font-semibold text-[11px] tracking-[0.08em] uppercase text-[#f6ecc8]">
              Exclusive to verified CIT-U students
            </span>
          </div>

          <h1 className="animate-fade-up delay-100 font-extrabold text-4xl sm:text-5xl md:text-6xl leading-[1.08] tracking-tight text-white">
            <span>Turn Tasks Into </span>
            <span className="text-[#c9a227]">Opportunities</span>
          </h1>

          <p className="animate-fade-up delay-200 font-normal text-base md:text-lg leading-relaxed text-[#fbf8f0]/85 max-w-md">
            Need a quick favor? Post a Quest. Want to earn extra cash? Complete
            one. QuestGo connects CIT-U students who need help with everyday
            tasks with verified students who are ready to help.
          </p>

          {/* CTA buttons — only these drift with the mouse.
              Wrapped in its own layer so the fade-up animation
              (which owns the inner element's transform) never
              overrides the parallax transform. */}
          <div
            style={{
              transform: `translate3d(${mouse.x * 8}px, ${mouse.y * 6}px, 0)`,
              transition: "transform 0.25s ease-out",
            }}
          >
            <div className="animate-fade-up delay-300 flex flex-wrap items-center gap-4 mt-2">
              <a
                href="/login"
                className="btn-glow inline-flex items-center gap-2 bg-[#c9a227] hover:bg-[#b08b1e] text-[#161414] px-6 py-3 rounded-xl font-bold text-[15px] shadow-[0_4px_20px_rgba(201,162,39,0.3)] hover:shadow-[0_6px_24px_rgba(201,162,39,0.55)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Find a Quest
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/login"
                className="inline-flex items-center border-2 border-solid border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/10 hover:border-[#c9a227] hover:-translate-y-0.5 transition-all duration-200 font-semibold text-[15px]"
              >
                Post a Quest
              </a>
            </div>
          </div>
        </div>

        {/* Stage for the floating card cluster — cards still react to the mouse */}
        <div className="relative flex justify-center md:justify-end py-10 md:py-16 px-4 md:px-8">
          {/* Reward payout — top-left */}
          <div className="animate-fade-up delay-200 absolute left-0 top-0 md:left-2 md:top-2 z-10">
            <FloatingCard
              width={168}
              rotate={-8}
              duration={5}
              delay={0}
              mouseX={mouse.x}
              mouseY={mouse.y}
              depth={0.7}
            >
              <p className="text-[10px] font-bold tracking-[0.06em] uppercase text-[#8a6a1f]">
                Quest reward
              </p>
              <p className="mt-1 font-extrabold text-xl text-[#7a1f32]">
                ₱250
                <span className="text-sm font-semibold text-[#4a4340]">.00</span>
              </p>
              <p className="mt-0.5 text-xs text-[#4a4340] font-medium">
                Print &amp; deliver docs
              </p>
            </FloatingCard>
          </div>

          {/* Verified helper — top-right */}
          <div className="animate-fade-up delay-300 absolute right-0 top-6 md:right-0 md:-top-2 z-20">
            <FloatingCard
              width={176}
              rotate={6}
              duration={6}
              delay={0.5}
              mouseX={mouse.x}
              mouseY={mouse.y}
              depth={1}
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-[#7a1f32]/10 text-[#7a1f32]">
                  MJ
                </div>
                <div>
                  <p className="text-xs font-bold text-[#161414]">Miguel J.</p>
                  <p className="text-[10px] font-semibold text-[#8a6a1f]">BS Computer Sci.</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#c9a227">
                  <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9L2 9.2l7.1-.6z" />
                </svg>
                <span className="text-[11px] font-bold text-[#4a4340]">4.9 · 32 quests</span>
              </div>
            </FloatingCard>
          </div>

          {/* Quest completed — bottom-left */}
          <div className="animate-fade-up delay-300 absolute left-2 bottom-4 md:-left-4 md:bottom-8 z-20">
            <FloatingCard
              width={152}
              rotate={5}
              duration={4.5}
              delay={0.9}
              mouseX={mouse.x}
              mouseY={mouse.y}
              depth={0.85}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-[#1f7a4c] flex items-center justify-center shrink-0">
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span className="text-[10px] font-extrabold tracking-[0.04em] uppercase text-[#1f7a4c]">
                  Completed
                </span>
              </div>
              <p className="mt-1 text-xs font-bold leading-snug text-[#161414]">
                Grocery run — Talamban
              </p>
            </FloatingCard>
          </div>

          {/* Main card — still tilts and drifts toward the cursor */}
          <div
            className="relative z-20"
            style={{
              transform: `perspective(900px) rotateX(${-mouse.y * 6}deg) rotateY(${
                mouse.x * 6
              }deg) translate3d(${mouse.x * 12}px, ${mouse.y * 12}px, 0)`,
              transition: "transform 0.25s ease-out",
            }}
          >
            <QuestCard />
          </div>
        </div>
      </div>
    </section>
  );
};