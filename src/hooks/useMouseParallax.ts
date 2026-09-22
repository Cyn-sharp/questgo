"use client";

import { useRef, useState } from "react";

/**
 * Tracks the pointer's position relative to a section, normalized to
 * -1..1 on each axis, throttled to one state update per animation
 * frame so listening sections don't re-render on every raw mousemove.
 *
 * Usage:
 *   const { ref, x, y, onMouseMove, onMouseLeave } = useMouseParallax<HTMLElement>();
 *   <section ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
 *     <div style={{ transform: `translate(${x * 10}px, ${y * 8}px)` }} />
 *   </section>
 *
 * Give farther-back or "heavier" elements a smaller multiplier and
 * foreground elements a larger one to fake depth.
 */
export function useMouseParallax<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const target = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const flush = () => {
    setPos({ ...target.current });
    rafId.current = null;
  };

  const onMouseMove = (e: React.MouseEvent<T>) => {
    const rect = ref.current?.getBoundingClientRect();
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

  return { ref, x: pos.x, y: pos.y, onMouseMove, onMouseLeave };
}