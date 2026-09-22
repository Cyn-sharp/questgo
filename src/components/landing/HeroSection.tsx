"use client";

import { useRef, useState } from "react";
import { QuestCard } from "./QuestCard";

type FloatingCardProps = {
  width: number;
  rotate: number;
  duration: number;
  delay: number;
  children: React.ReactNode;
  mouseX: number;
  mouseY: number;
  depth?: number;
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
    setOffset({ x: 0, y: 0 });
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
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: dragging ? "none" : "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: dragging ? 50 : undefined,
        position: "relative",
      }}
    >
      <div
        style={{
          transform: `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${rotate}deg) translate3d(${shiftX}px, ${shiftY}px, 0)`,
          transition: "transform 0.25s ease-out",
        }}
      >
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
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(14px) saturate(180%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow:
            0 10px 26px -12px rgba(22, 20, 20, 0.25),
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
        @media (hover: hover) {
          .glass-shine:hover::after {
            animation: glass-sweep 1.3s ease forwards;
          }
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
      className="relative w-full bg-transparent px-4 sm:px-6 md:px-16 py-12 md:py-24 overflow-hidden"
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
        {/* Text column — static text, no vertical movement on touch */}
        <div className="flex flex-col items-start gap-4 sm:gap-6 max-w-xl text-left">
          <div className="animate-fade-up inline-flex items-center gap-2 bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full">
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
            <span className="font-semibold text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-[#f6ecc8]">
              Exclusive to verified CIT-U students
            </span>
          </div>

          <h1 className="animate-fade-up delay-100 font-extrabold text-3xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight text-white">
            <span>Turn Tasks Into </span>
            <span className="text-[#c9a227]">Opportunities</span>
          </h1>

          <p className="animate-fade-up delay-200 font-normal text-sm sm:text-base md:text-lg leading-relaxed text-[#fbf8f0]/85 max-w-md">
            Need a quick favor? Post a Quest. Want to earn extra cash? Complete
            one. QuestGo connects CIT-U students who need help with everyday
            tasks with verified students who are ready to help.
          </p>

          {/* CTA buttons — only these drift slightly with the mouse */}
          <div
            style={{
              transform: `translate3d(${mouse.x * 6}px, ${mouse.y * 4}px, 0)`,
              transition: "transform 0.25s ease-out",
            }}
            className="w-full sm:w-auto"
          >
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
              <a
                href="/login"
                className="btn-glow inline-flex items-center justify-center gap-2 bg-[#c9a227] active:scale-95 text-[#161414] px-6 py-3.5 rounded-xl font-bold text-[15px] shadow-[0_4px_20px_rgba(201,162,39,0.25)] transition-all duration-200"
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
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center border-2 border-solid border-white/20 active:scale-95 text-white px-6 py-3.5 rounded-xl transition-all duration-200 font-semibold text-[15px]"
              >
                Post a Quest
              </a>
            </div>
          </div>
        </div>

        {/* Stage for the floating card cluster — cards stack and adapt nicely on mobile */}
        <div className="relative flex justify-center md:justify-end py-8 md:py-16 px-2 w-full max-w-lg mx-auto md:max-w-none">
          {/* Reward payout — top-left */}
          <div className="animate-fade-up delay-200 absolute left-0 top-0 sm:left-4 z-10 scale-90 sm:scale-100">
            <FloatingCard
              width={150}
              rotate={-6}
              duration={5}
              delay={0}
              mouseX={mouse.x}
              mouseY={mouse.y}
              depth={0.6}
            >
              <p className="text-[9px] font-bold tracking-[0.06em] uppercase text-[#8a6a1f]">
                Quest reward
              </p>
              <p className="mt-0.5 font-extrabold text-lg text-[#7a1f32]">
                ₱250
                <span className="text-xs font-semibold text-[#4a4340] inline-block">.00</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[#4a4340] font-medium leading-tight">
                Print &amp; deliver docs
              </p>
            </FloatingCard>
          </div>

          {/* Verified helper — top-right */}
          <div className="animate-fade-up delay-300 absolute right-0 top-4 sm:right-4 z-20 scale-90 sm:scale-100">
            <FloatingCard
              width={160}
              rotate={4}
              duration={6}
              delay={0.5}
              mouseX={mouse.x}
              mouseY={mouse.y}
              depth={0.8}
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#7a1f32]/10 text-[#7a1f32]">
                  MJ
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#161414] leading-tight">Miguel J.</p>
                  <p className="text-[9px] font-semibold text-[#8a6a1f] leading-tight">BS CS</p>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#c9a227">
                  <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9L2 9.2l7.1-.6z" />
                </svg>
                <span className="text-[10px] font-bold text-[#4a4340]">4.9 · 32 quests</span>
              </div>
            </FloatingCard>
          </div>

          {/* Quest completed — bottom-left */}
          <div className="animate-fade-up delay-300 absolute left-2 bottom-0 sm:left-6 z-20 scale-90 sm:scale-100">
            <FloatingCard
              width={140}
              rotate={4}
              duration={4.5}
              delay={0.9}
              mouseX={mouse.x}
              mouseY={mouse.y}
              depth={0.7}
            >
              <div className="flex items-center gap-1">
                <div className="h-3.5 w-3.5 rounded-full bg-[#1f7a4c] flex items-center justify-center shrink-0">
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span className="text-[9px] font-extrabold tracking-[0.04em] uppercase text-[#1f7a4c]">
                  Completed
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-bold leading-tight text-[#161414]">
                Printing - GLE - BUILDING
              </p>
            </FloatingCard>
          </div>

          {/* Main card — centers perfectly and scales down gracefully on small devices */}
          <div
            className="relative z-15 scale-95 sm:scale-100 w-full flex justify-center"
            style={{
              transform: `perspective(900px) rotateX(${-mouse.y * 4}deg) rotateY(${
                mouse.x * 4
              }deg) translate3d(${mouse.x * 8}px, ${mouse.y * 8}px, 0)`,
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